import { Table } from 'react-bootstrap';
import React, { useMemo } from 'react';
import { useTable } from 'react-table';

export default function SwapsTable({swaps}) {

  const columns = React.useMemo(
    () => [
      {
        Header: 'Date',
        accessor: 'timestamp',
      },
      {
        Header: 'Amount 0',
        accessor: 'amount0',
      },
      {
        Header: 'Amount 1',
        accessor: 'amount1',
      }
    ],
    []
  )
  const tableInstance = useTable({columns, data: swaps});
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
              <th {...column.getHeaderProps()}>
                {// Render the header
                column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* Apply the table body props */}
      <tbody {...getTableBodyProps()}>
        {// Loop over the table rows
        rows.map(row => {
          // Prepare the row for display
          prepareRow(row)
          return (
            // Apply the row props
            <tr {...row.getRowProps()}>
              {// Loop over the rows cells
              row.cells.map(cell => {
                // Apply the cell props
                return (
                  <td {...cell.getCellProps()}>
                    {// Render the cell contents
                    cell.render('Cell')}
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