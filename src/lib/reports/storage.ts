// Supabase Storage Helper for Reports
import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'reports'

// Create a service role client for server-side operations
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Generate file path for report
export function getReportFilePath(reportType: 'daily' | 'monthly', reportDate: Date): string {
  const dateStr = reportType === 'monthly'
    ? `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`
    : reportDate.toISOString().split('T')[0]

  return `${reportType}/${dateStr}.pdf`
}

// Upload PDF to Supabase Storage
export async function uploadReportPDF(
  pdfBuffer: Buffer,
  filePath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = getStorageClient()

  if (!supabase) {
    console.warn('Supabase not configured. Storing report path only.')
    return { success: true, path: filePath }
  }

  try {
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
      })

      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating bucket:', createError)
        return { success: false, error: createError.message }
      }
    }

    // Upload the PDF
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading PDF:', error)
      return { success: false, error: error.message }
    }

    return { success: true, path: data.path }
  } catch (err) {
    console.error('Storage error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Get signed download URL for a report
export async function getReportDownloadUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = getStorageClient()

  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (err) {
    console.error('URL generation error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Delete a report from storage
export async function deleteReportPDF(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getStorageClient()

  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Error deleting PDF:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Delete error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// List all reports in storage
export async function listReports(
  reportType?: 'daily' | 'monthly'
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  const supabase = getStorageClient()

  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const path = reportType || ''
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path, {
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Error listing reports:', error)
      return { success: false, error: error.message }
    }

    const files = data
      .filter(f => f.name.endsWith('.pdf'))
      .map(f => path ? `${path}/${f.name}` : f.name)

    return { success: true, files }
  } catch (err) {
    console.error('List error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
