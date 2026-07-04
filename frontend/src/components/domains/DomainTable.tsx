import { useMemo, useState } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender, createColumnHelper, SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Service } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, daysLabel } from '@/lib/utils'

const ch = createColumnHelper<Service>()

interface Props {
  services:          Service[]
  selectedIds:       number[]
  onSelectionChange: (ids: number[]) => void
  onEdit:            (s: Service) => void
  onDelete:          (s: Service) => void
}

export function DomainTable({ services, selectedIds, onSelectionChange, onEdit, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const toggleOne = (id: number) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  const toggleAll = () =>
    onSelectionChange(selectedIds.length === services.length ? [] : services.map(s => s.id))

  const columns = useMemo(() => [
    ch.display({
      id: 'select',
      header: () => (
        <input type="checkbox"
          checked={services.length > 0 && selectedIds.length === services.length}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-ink-300" />
      ),
      cell: ({ row }) => (
        <input type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleOne(row.original.id)}
          className="h-4 w-4 rounded border-ink-300" />
      ),
    }),
    ch.accessor('service_name', {
      header: 'Service Name',
      cell: info => <span className="font-medium text-ink-900">{info.getValue()}</span>,
    }),
    ch.accessor('entity_name', {
      header: 'Entity Name',
      cell: info => <span className="text-ink-700">{info.getValue()}</span>,
    }),
    ch.accessor('location', {
      header: 'Location',
      cell: info => <span className="text-ink-500 text-sm">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('start_date', {
      header: 'Start Date',
      cell: info => <span className="text-ink-500 text-sm">{formatDate(info.getValue())}</span>,
    }),
    ch.accessor('expiry_date', {
      header: 'Expiration Date',
      cell: info => <span className="text-ink-700 text-sm font-medium">{formatDate(info.getValue())}</span>,
    }),
    ch.accessor('status', {
      header: 'Status',
      cell: info => <span className="text-ink-500 text-sm">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('service_provider', {
      header: 'Service Provider',
      cell: info => <span className="text-ink-500 text-sm">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('account_details', {
      header: 'Account Details',
      cell: info => <span className="text-ink-500 text-sm line-clamp-2">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('contact_details', {
      header: 'Contact Details',
      cell: info => <span className="text-ink-500 text-sm line-clamp-2">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('nda_status', {
      header: 'NDA Status',
      cell: info => <span className="text-ink-500 text-sm">{info.getValue() || '—'}</span>,
    }),
    ch.accessor('nda_expire_date', {
      header: 'NDA Expire Date',
      cell: info => <span className="text-ink-500 text-sm">{formatDate(info.getValue())}</span>,
    }),
    ch.accessor('nda_expire_date', {
      header: 'NDA Expire Date',
      cell: info => <span className="text-ink-500 text-sm">{formatDate(info.getValue())}</span>,
    }),
    ch.accessor('cost', {
      header: 'Cost',
      cell: info => {
        const v = info.getValue()
        return <span className="text-ink-500 text-sm font-mono">{v ? Number(v).toLocaleString() : '—'}</span>
      },
    }),
    ch.accessor('days_remaining', {
      header: 'Days Left',
      cell: info => <span className="font-mono text-sm text-ink-600">{daysLabel(info.getValue())}</span>,
    }),
    ch.display({
      id: 'expiry_status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.expiry_status} />,
    }),
    ch.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(row.original)}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(row.original)}
            className="rounded-md p-1.5 text-ink-400 hover:bg-status-dangerBg hover:text-status-danger transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    }),
  ], [services, selectedIds])

  const table = useReactTable({
    data: services, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-50 border-b border-ink-200">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide whitespace-nowrap">
                    {header.column.getCanSort() ? (
                      <button onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-ink-900 transition-colors">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc'  && <ChevronUp size={13} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={13} />}
                      </button>
                    ) : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-ink-100">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-ink-50/60 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
        <p className="text-sm text-ink-500">
          {services.length} service{services.length !== 1 ? 's' : ''}
          {table.getPageCount() > 1 && ` · page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
