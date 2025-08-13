import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  try {
    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description || null, // Handle optional/nullable description
        completed: false // New todos start as incomplete (default from schema)
        // created_at and updated_at will be automatically set by database defaults
      })
      .returning()
      .execute();

    // Return the created todo
    const todo = result[0];
    return {
      ...todo,
      // No numeric conversion needed - all fields are already correct types
    };
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
};