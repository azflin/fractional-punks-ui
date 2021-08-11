import React from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';

export default function SwapsTable({swaps, token0, token1}) {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Date',
        accessor: 'timestamp',
        Cell: props => new Intl.DateTimeFormat('en-US', {
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric',
          hour12: false,
          timeZone: 'ETC/GMT'
        }).format(new Date(props.value * 1000))
      },
      {
        Header: token0,
        accessor: 'amount0',
        Cell: props => parseFloat(props.value).toFixed(3)
      },
      {
        Header: token1,
        accessor: 'amount1',
        Cell: props => parseFloat(props.value).toFixed(1)
      }
    ],
    [token0, token1]
  )
  const tableInstance = useTable({columns, data: swaps}, useSortBy, usePagination);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;

  return (
    <div>
      <h3>Trades (Last 100)</h3>
      <table {...getTableProps()} style={{width: "80%", border: "1px solid white", borderStyle: "ridge", color: "white"}} className="mb-2">
        <thead style={{background: 'rgba(83, 83, 83, 0.55)'}}>
          {
          headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {
              headerGroup.headers.map(column => (
                // Add column header sorting
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {
          page.map(row => {
            prepareRow(row);
            return (
              // Conditionally color rows red or green depending on if buy or sell
              <tr {...row.getRowProps([{style: {
                  background: parseFloat(row.values.amount0) > 0
                    ? (token0 === 'WETH' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)')
                    : (token0 === 'WETH' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)')
                }}])}>
                {
                row.cells.map(cell => {
                  return (
                    <td {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>&nbsp;
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>&nbsp;
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>&nbsp;
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>&nbsp;
        <span>
          Page&nbsp;
          <strong>
            {pageIndex + 1} of {pageOptions.length}&nbsp;
          </strong>&nbsp;
        </span>
        <span>
          | Go to page:&nbsp;
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>&nbsp;
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}