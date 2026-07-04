import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Service, ServiceFormData } from '@/types'

interface ServiceFormModalProps {
  isOpen:        boolean
  onClose:       () => void
  onSubmit:      (data: ServiceFormData) => Promise<void>
  initialData?:  Service | null
  isSubmitting?: boolean
  serverError?:  string | null
}

export function DomainFormModal({
  isOpen, onClose, onSubmit, initialData, isSubmitting, serverError,
}: ServiceFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>()

  useEffect(() => {
    if (!isOpen) return
    reset(initialData ? {
      service_name:     initialData.service_name,
      entity_name:      initialData.entity_name,
      expiry_date:      initialData.expiry_date,
      location:         initialData.location         ?? '',
      start_date:       initialData.start_date        ?? '',
      status:           initialData.status            ?? '',
      service_provider: initialData.service_provider  ?? '',
      account_details:  initialData.account_details   ?? '',
      contact_details:  initialData.contact_details   ?? '',
      nda_status:       initialData.nda_status         ?? '',
      nda_expire_date:  initialData.nda_expire_date    ?? '',
      cost:             initialData.cost               ?? '',
    } : {
      service_name: '', entity_name: '', expiry_date: '',
      location: '', start_date: '', status: '', service_provider: '',
      account_details: '', contact_details: '', nda_status: '',
      nda_expire_date: '', cost: '',
    })
  }, [isOpen, initialData, reset])

  const label = (text: string, required = false) => (
    <label className="block text-sm font-medium text-ink-700 mb-1.5">
      {text}{required && <span className="text-status-danger ml-0.5">*</span>}
    </label>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={initialData ? 'Edit Service' : 'Add Service'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {serverError && (
          <div className="rounded-lg bg-status-dangerBg border border-status-dangerBorder px-3 py-2 text-sm text-status-danger">
            {serverError}
          </div>
        )}

        {/* ── Required ── */}
        <div className="rounded-lg border border-ink-200 p-4 space-y-4">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Required</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {label('Service Name', true)}
              <input {...register('service_name', { required: 'Required' })}
                placeholder="Domain, SSL, NDA, Licence…" className="input-field" />
              {errors.service_name && <p className="text-xs text-status-danger mt-1">{errors.service_name.message}</p>}
            </div>
            <div>
              {label('Entity Name', true)}
              <input {...register('entity_name', { required: 'Required' })}
                placeholder="example.com, Vendor X…" className="input-field" />
              {errors.entity_name && <p className="text-xs text-status-danger mt-1">{errors.entity_name.message}</p>}
            </div>
          </div>
          <div className="w-1/2 pr-2">
            {label('Expiration Date', true)}
            <input type="date" {...register('expiry_date', { required: 'Required' })} className="input-field" />
            {errors.expiry_date && <p className="text-xs text-status-danger mt-1">{errors.expiry_date.message}</p>}
          </div>
        </div>

        {/* ── Optional ── */}
        <div className="rounded-lg border border-ink-200 p-4 space-y-4">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Optional</p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              {label('Start Date')}
              <input type="date" {...register('start_date')} className="input-field" />
            </div>
            <div>
              {label('Location')}
              <input {...register('location')} placeholder="US-East, Mumbai…" className="input-field" />
            </div>
            <div>
              {label('Service Provider')}
              <input {...register('service_provider')} placeholder="Cloudflare, GoDaddy…" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {label('Status')}
              <input {...register('status')} placeholder="Active, Pending…" className="input-field" />
            </div>
            <div>
              {label('Cost')}
              <input {...register('cost')} placeholder="1200.00" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              {label('NDA Status')}
              <input {...register('nda_status')} placeholder="Signed, N/A…" className="input-field" />
            </div>
            <div>
              {label('NDA Expire Date')}
              <input type="date" {...register('nda_expire_date')} className="input-field" />
            </div>
          </div>

          <div>
            {label('Account Details')}
            <textarea {...register('account_details')} rows={2}
              placeholder="Account ID, login portal…" className="input-field resize-none" />
          </div>
          <div>
            {label('Contact Details')}
            <textarea {...register('contact_details')} rows={2}
              placeholder="Account manager name, phone…" className="input-field resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
