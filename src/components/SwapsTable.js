import React from 'react';
import { useTable, useSortBy } from 'react-table';

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
      },
      {
        Header: token1,
        accessor: 'amount1',
      }
    ],
    []
  )
  const tableInstance = useTable({columns, data: swaps}, useSortBy);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    // apply the table props
   <table {...getTableProps()} className="table">
      <thead>
        {// Loop over the header rows
        headerGroups.map(headerGroup => (
          // Apply the header row props
          <tr {...headerGroup.getHeaderGroupProps()}>
            {// Loop over the headers in each row
            headerGroup.headers.map(column => (
              // Apply the header cell props
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
      {/* Apply the table body props */}
      <tbody {...getTableBodyProps()}>
        {// Loop over the table rows
        rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
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
  )
}