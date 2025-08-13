import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo and return true', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    const input: DeleteTodoInput = {
      id: todoId
    };

    // Delete the todo
    const result = await deleteTodo(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the todo is actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 99999 // Non-existent ID
    };

    // Attempt to delete non-existent todo
    const result = await deleteTodo(input);

    // Should return false indicating no record was deleted
    expect(result).toBe(false);
  });

  it('should not affect other todos when deleting specific todo', async () => {
    // Create multiple test todos
    const insertResults = await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First todo description',
          completed: false
        },
        {
          title: 'Second Todo', 
          description: 'Second todo description',
          completed: true
        },
        {
          title: 'Third Todo',
          description: null, // Testing nullable description
          completed: false
        }
      ])
      .returning()
      .execute();

    const firstTodoId = insertResults[0].id;
    const secondTodoId = insertResults[1].id;
    const thirdTodoId = insertResults[2].id;

    // Delete only the second todo
    const input: DeleteTodoInput = {
      id: secondTodoId
    };

    const result = await deleteTodo(input);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify only the second todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    const remainingIds = remainingTodos.map(todo => todo.id);
    expect(remainingIds).toContain(firstTodoId);
    expect(remainingIds).toContain(thirdTodoId);
    expect(remainingIds).not.toContain(secondTodoId);

    // Verify the remaining todos are unchanged
    const firstTodo = remainingTodos.find(todo => todo.id === firstTodoId);
    const thirdTodo = remainingTodos.find(todo => todo.id === thirdTodoId);

    expect(firstTodo?.title).toBe('First Todo');
    expect(firstTodo?.completed).toBe(false);
    expect(thirdTodo?.title).toBe('Third Todo');
    expect(thirdTodo?.description).toBe(null);
    expect(thirdTodo?.completed).toBe(false);
  });

  it('should handle completed todos deletion correctly', async () => {
    // Create a completed todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This todo is already completed',
        completed: true
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    const input: DeleteTodoInput = {
      id: todoId
    };

    // Delete the completed todo
    const result = await deleteTodo(input);

    // Should return true
    expect(result).toBe(true);

    // Verify deletion
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });
});