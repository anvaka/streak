import makeRowsModel from 'src/lib/sheetViewModel';

describe('Sheet view model', () => {
  it('can group', () => {
    const data = makeRowsModel([
      ['2017-01-02', 1],
      ['2017-01-02', 2],
      ['2017-01-03', 3],
      ['2017-01-04', 4],
    ]);
    const dateGroups = data.groupBy(x => {
      return new Date(x[0]).toDateString();
    });
    expect(dateGroups.size).to.equal(3);
  });
});
