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
        Cell: props => parseFloat(props.value).toFixed(3)
      },
      {
        Header: token1,
        accessor: 'amount1',
        Cell: props => parseFloat(props.value).toFixed(1)
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
   <table {...getTableProps()} className="table table-hover">
      <thead>
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
        rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps([{style: {background: parseFloat(row.values.amount0) > 0 ? 'rgba(0, 255, 0, 0.25)' : 'rgba(255, 0, 0, 0.25)'}}])}>
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