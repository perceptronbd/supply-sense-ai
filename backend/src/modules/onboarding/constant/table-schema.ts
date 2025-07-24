export const GET_TABLES_QUERY = `
        SELECT 
          -- Basic column information
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          
          -- Primary key detection
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
          
          -- Foreign key detection
          CASE WHEN fk.ku_column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
          fk.foreign_table_name,
          fk.foreign_column_name,
          
          -- Check if THIS specific foreign key column has a unique constraint
          CASE WHEN uk.column_name IS NOT NULL THEN true ELSE false END as fk_is_unique,
          
          -- Column comments
          col_description(pgc.oid, c.ordinal_position) as column_comment
          
        FROM information_schema.columns c
        
        -- Join for primary key information
        LEFT JOIN (
          SELECT ku.table_name, ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
        
        -- Join for foreign key information
        LEFT JOIN (
          SELECT 
            ku.table_name, 
            ku.column_name AS ku_column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
        ) fk ON c.table_name = fk.table_name AND c.column_name = fk.ku_column_name
        
        -- Join to check if the foreign key column itself has a unique constraint
        LEFT JOIN (
          SELECT ku.table_name, ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'UNIQUE'
        ) uk ON c.table_name = uk.table_name AND c.column_name = uk.column_name
        
        -- Join for column comments
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      ` as const;
