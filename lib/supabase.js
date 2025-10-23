import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aphiegzdhtoddpuatojx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaGllZ3pkaHRvZGRwdWF0b2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODEwMjEsImV4cCI6MjA3NjI1NzAyMX0.bX_SGycgk3u1M1eDQU3fsL39mCx5VXWYF1RO-3YcnsA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
