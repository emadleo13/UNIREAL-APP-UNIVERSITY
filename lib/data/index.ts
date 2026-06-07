import type { DataRepository } from './repository';
import { mockRepository } from './mock';
import { supabaseRepository } from './supabase';

/**
 * Factory: choose the active data source. The UI imports only `repo`, so
 * switching to Supabase is a one-line env change with zero component edits.
 */
export const repo: DataRepository =
  process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase'
    ? supabaseRepository
    : mockRepository;

export type { DataRepository, UniversityMatch } from './repository';
export * from './types';
