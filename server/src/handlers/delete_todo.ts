import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<boolean> => {
  try {
    // Delete the todo record by ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};