import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
}) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update title of existing todo', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo();
    const originalUpdatedAt = testTodo.updated_at;

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual(testTodo.description);
    expect(result!.completed).toEqual(testTodo.completed);
    expect(result!.created_at).toEqual(testTodo.created_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should update description of existing todo', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.title).toEqual(testTodo.title);
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(testTodo.completed);
  });

  it('should update completed status of existing todo', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.title).toEqual(testTodo.title);
    expect(result!.description).toEqual(testTodo.description);
    expect(result!.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.title).toEqual('New Title');
    expect(result!.description).toEqual('New description');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.description).toBeNull();
    expect(result!.title).toEqual(testTodo.title);
    expect(result!.completed).toEqual(testTodo.completed);
  });

  it('should return null for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Database Update Test',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the changes were persisted to the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Update Test');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > testTodo.updated_at).toBe(true);
  });

  it('should only update provided fields, leaving others unchanged', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    // Only update the completed status
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.completed).toEqual(true); // Should be updated
  });

  it('should handle updating todo with null description', async () => {
    // Create a todo with null description
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: null
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeTruthy();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(testTodo.completed);
  });
});