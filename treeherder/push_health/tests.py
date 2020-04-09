import datetime
import json
import logging
import re
# from collections import defaultdict

# from django.core.cache import cache
from django.db.models import Q

from treeherder.model.models import FailureLine, Job, OptionCollection
# from treeherder.push_health.classification import set_classifications
# from treeherder.push_health.filter import filter_failure
from treeherder.push_health.utils import clean_config, clean_platform, clean_test, job_to_dict
# from treeherder.webapp.api.utils import REPO_GROUPS

logger = logging.getLogger(__name__)

CACHE_KEY_ROOT = 'failure_history'
ONE_WEEK_IN_SECONDS = 604800
intermittent_history_days = 14
fixed_by_commit_history_days = 30
ignored_log_lines = [
    'Return code: 1',
    'exit status 1',
    'unexpected status',
    'Force-terminating active process(es)',
]


def has_job(job, job_list):
    return next((find_job for find_job in job_list if find_job['id'] == job.id), False)


def has_line(failure_line, log_line_list):
    return next(
        (find_line for find_line in log_line_list if find_line['line_number'] == failure_line.line),
        False,
    )


def get_test_failure_jobs(push):
    testfailed_jobs = (
        Job.objects.filter(
            push=push,
            tier__lte=2,
            result='testfailed',
        )
        .exclude(
            Q(machine_platform__platform='lint') | Q(job_type__symbol='mozlint'),
        )
        .select_related('job_type', 'machine_platform', 'taskcluster_metadata')
    )
    failed_job_types = [job.job_type.name for job in testfailed_jobs]
    passing_jobs = Job.objects.filter(
        push=push, job_type__name__in=failed_job_types, result__in=['success', 'unknown']
    ).select_related('job_type', 'machine_platform', 'taskcluster_metadata')

    jobs = {}

    def add_jobs(job_list):
        for job in job_list:
            if job.job_type.name in jobs:
                jobs[job.job_type.name].append(job_to_dict(job))
            else:
                jobs[job.job_type.name] = [job_to_dict(job)]

    add_jobs(testfailed_jobs)
    add_jobs(passing_jobs)

    for job in jobs:
        (jobs[job]).sort(key=lambda x: x['start_time'])

    return jobs


# noinspection PoetryPackageRequirements
def get_test_failures(failed_jobs_labels, likely_regression_labels):
    # option_map is used to map platforms for the job.option_collection_hash
    option_map = OptionCollection.objects.get_option_collection_map()

    new_failure_lines = FailureLine.objects.filter(
        action__in=['test_result', 'log', 'crash'],
        job_log__job__job_type__name__in=failed_jobs_labels,
        job_log__job__result='testfailed',
    ).select_related(
        'job_log__job__job_type',
        'job_log__job__job_group',
        'job_log__job__machine_platform',
        'job_log__job__taskcluster_metadata',
    )
    # using a dict here to avoid duplicates due to multiple failure_lines for
    # each job.
    regressions = {
        'tests': {},
        'otherJobs': [],
    }
    known_issues = {
        'tests': {},
        'otherJobs': [],
    }
    # Keep track of these so that we can add them to the 'otherJobs'
    labels_without_failure_lines = failed_jobs_labels.copy()

    for failure_line in new_failure_lines:
        test_name = clean_test(
            failure_line.action, failure_line.test, failure_line.signature, failure_line.message
        )
        if not test_name:
            continue
        job = failure_line.job_log.job
        config = clean_config(option_map[job.option_collection_hash])
        platform = clean_platform(job.machine_platform.platform)
        job_name = job.job_type.name
        job_symbol = job.job_type.symbol
        job_group = job.job_group.name
        job_group_symbol = job.job_group.symbol
        job.job_key = '{}{}{}{}'.format(config, platform, job_name, job_group)
        # The 't' ensures the key starts with a character, as required for a query selector
        test_key = re.sub(
            r'\W+', '', 't{}{}{}{}{}'.format(test_name, config, platform, job_name, job_group)
        )
        classification = known_issues
        if job_name in likely_regression_labels:
            classification = regressions
            if job_name in labels_without_failure_lines:
                labels_without_failure_lines.remove(job_name)

        if test_key not in classification['tests']:
            classification['tests'][test_key] = {
                'testName': test_name,
                'action': failure_line.action.split('_')[0],
                'jobName': job_name,
                'jobSymbol': job_symbol,
                'jobGroup': job_group,
                'jobGroupSymbol': job_group_symbol,
                'platform': platform,
                'config': config,
                'key': test_key,
                'jobKey': job.job_key,
                'suggestedClassification': 'New Failure',
                'confidence': 0,
                'tier': job.tier,
            }

    # Any labels that were not in a FailureLine should go into the appropriate bucket 'otherJobs' list.
    for label in labels_without_failure_lines:
        bucket = regressions if label in likely_regression_labels else known_issues
        bucket['otherJobs'].append(label)

    return {'regressions': regressions, 'knownIssues': known_issues}
