export const DST_TEST_CASES = {
  springForward: {
    date: '2023-03-12',
    before: '01:59:00',
    after: '03:00:00'
  },
  fallBack: {
    date: '2023-11-05',
    before: '01:59:00',
    after: '01:00:00'
  }
};

export function createTransitionTestCases() {
  return {
    preDST: DateTime.fromObject({ 
      year: 2023, 
      month: 3, 
      day: 12, 
      hour: 1, 
      minute: 30 
    }).setZone(DEFAULT_TZ),
    postDST: DateTime.fromObject({ 
      year: 2023, 
      month: 3, 
      day: 12, 
      hour: 3, 
      minute: 0 
    }).setZone(DEFAULT_TZ)
  };
}

export function multiSessionEdgeCases() {
  return {
    midnightTransition: {
      start: '23:30',
      end: '01:30',
      spansDays: true
    },
    dstStart: {
      start: '01:30',
      end: '03:30',
      spansDST: true
    }
  };
}
