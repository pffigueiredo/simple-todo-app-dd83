import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    // Query for the todo by ID
    const results = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return the first result if found, otherwise null
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};