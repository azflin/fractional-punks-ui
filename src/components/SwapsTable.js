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
   <table {...getTableProps()} className="table table-hover">
      <thead>
        {
        headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {
            headerGroup.headers.map(column => (
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
            <tr {...row.getRowProps([{style: {background: 'blue'}}])}>
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