import React from 'react';
import PropTypes from 'prop-types';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import ClassificationGroup from './ClassificationGroup';
import { filterTests } from './helpers';

export default class TestMetric extends React.PureComponent {
  render() {
    const {
      data,
      repo,
      revision,
      notify,
      currentRepo,
      searchStr,
      jobs,
      showParentMatches,
      regressionsOrderBy,
      regressionsGroupBy,
      knownIssuesOrderBy,
      knownIssuesGroupBy,
      updateParamsAndState,
      selectedJobName,
      selectedTaskId,
      selectedTest,
      testGroup,
    } = this.props;
    const { details } = data;
    const { needInvestigation, knownIssues } = details;
    let filteredNeedInvestigation = needInvestigation;
    let filteredKnownIssues = knownIssues;

    if (searchStr.length || !showParentMatches) {
      filteredNeedInvestigation = filterTests(
        needInvestigation.tests,
        searchStr,
        showParentMatches,
      );
      filteredKnownIssues = filterTests(
        knownIssues.tests,
        searchStr,
        showParentMatches,
      );
    }

    return (
      <div className="border-bottom border-secondary">
        <ClassificationGroup
          jobs={jobs}
          tests={filteredNeedInvestigation}
          unstructuredFailures={needInvestigation.unstructuredFailures}
          name="Possible Regressions"
          repo={repo}
          currentRepo={currentRepo}
          revision={revision}
          className="mb-5"
          icon={faExclamationTriangle}
          iconColor={
            filteredNeedInvestigation.length ? 'danger' : 'darker-secondary'
          }
          expanded={testGroup === 'pr'}
          testGroup={testGroup}
          selectedTest={selectedTest}
          hasRetriggerAll
          notify={notify}
          orderedBy={regressionsOrderBy}
          groupedBy={regressionsGroupBy}
          selectedJobName={selectedJobName}
          selectedTaskId={selectedTaskId}
          setOrderedBy={(regressionsOrderBy) =>
            updateParamsAndState({ regressionsOrderBy, testGroup: 'pr' })
          }
          setGroupedBy={(regressionsGroupBy) =>
            updateParamsAndState({ regressionsGroupBy, testGroup: 'pr' })
          }
          updateParamsAndState={(stateObj) => {
            stateObj.testGroup = 'pr';
            updateParamsAndState(stateObj);
          }}
        />
        <ClassificationGroup
          jobs={jobs}
          tests={filteredKnownIssues}
          unstructuredFailures={knownIssues.unstructuredFailures}
          name="Known Issues"
          repo={repo}
          currentRepo={currentRepo}
          revision={revision}
          className="mb-5"
          icon={faExclamationTriangle}
          iconColor={
            filteredKnownIssues.length ? 'warning' : 'darker-secondary'
          }
          expanded={testGroup === 'ki'}
          testGroup={testGroup}
          selectedTest={selectedTest}
          hasRetriggerAll
          notify={notify}
          selectedTaskId={selectedTaskId}
          orderedBy={knownIssuesOrderBy}
          groupedBy={knownIssuesGroupBy}
          selectedJobName={selectedJobName}
          setOrderedBy={(knownIssuesOrderBy) =>
            updateParamsAndState({ knownIssuesOrderBy, testGroup: 'ki' })
          }
          setGroupedBy={(knownIssuesGroupBy) =>
            updateParamsAndState({ knownIssuesGroupBy, testGroup: 'ki' })
          }
          updateParamsAndState={(stateObj) => {
            stateObj.testGroup = 'ki';
            updateParamsAndState(stateObj);
          }}
        />
      </div>
    );
  }
}

TestMetric.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    result: PropTypes.string.isRequired,
    details: PropTypes.shape({
      needInvestigation: PropTypes.shape({
        tests: PropTypes.array.isRequired,
        unstructuredFailures: PropTypes.array.isRequired,
      }),
      knownIssues: PropTypes.shape({
        tests: PropTypes.array.isRequired,
        unstructuredFailures: PropTypes.array.isRequired,
      }),
    }).isRequired,
  }).isRequired,
  repo: PropTypes.string.isRequired,
  currentRepo: PropTypes.shape({}).isRequired,
  revision: PropTypes.string.isRequired,
  notify: PropTypes.func.isRequired,
  searchStr: PropTypes.string.isRequired,
  showParentMatches: PropTypes.bool.isRequired,
  testGroup: PropTypes.string,
  regressionsOrderBy: PropTypes.string,
  regressionsGroupBy: PropTypes.string,
  knownIssuesOrderBy: PropTypes.string,
  knownIssuesGroupBy: PropTypes.string,
  updateParamsAndState: PropTypes.func.isRequired,
};

TestMetric.defaultProps = {
  regressionsOrderBy: 'count',
  regressionsGroupBy: 'path',
  knownIssuesOrderBy: 'count',
  knownIssuesGroupBy: 'path',
  testGroup: '',
};
