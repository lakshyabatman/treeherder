export const resultColorMap = {
  pass: 'success',
  fail: 'danger',
  indeterminate: 'darker-secondary',
  done: 'darker-info',
  'in progress': 'darker-secondary',
  none: 'darker-info',
};

export const taskResultColorMap = {
  success: 'success',
  testfailed: 'danger',
  busted: 'danger',
  unknown: 'darker-secondary',
};

export const filterTests = (tests, searchStr) => {
  const filters = searchStr.split(' ').map((filter) => new RegExp(filter, 'i'));

  return tests.filter((test) =>
    filters.every((f) =>
      f.test(`${test.testName} ${test.platform} ${test.config}`),
    ),
  );
};
