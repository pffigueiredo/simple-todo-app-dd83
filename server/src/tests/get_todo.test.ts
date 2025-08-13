import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Test retrieving the todo
    const input: GetTodoInput = { id: createdTodo.id };
    const result = await getTodo(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const input: GetTodoInput = { id: 999 }; // Non-existent ID
    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should handle todo with null description', async () => {
    // Create a todo with null description
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Test retrieving the todo
    const input: GetTodoInput = { id: createdTodo.id };
    const result = await getTodo(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Todo without description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the correct todo when multiple todos exist', async () => {
    // Create multiple todos
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second description',
        completed: true
      })
      .returning()
      .execute();

    // Test retrieving the second todo specifically
    const input: GetTodoInput = { id: todo2[0].id };
    const result = await getTodo(input);

    // Verify we get the correct todo
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo2[0].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.description).toEqual('Second description');
    expect(result!.completed).toBe(true);
  });

  it('should handle edge case with ID 0', async () => {
    const input: GetTodoInput = { id: 0 };
    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    const input: GetTodoInput = { id: -1 };
    const result = await getTodo(input);

    expect(result).toBeNull();
  });
});