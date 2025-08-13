import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs with different scenarios
const basicTestInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

const minimalTestInput: CreateTodoInput = {
  title: 'Minimal Todo'
  // description is optional
};

const nullDescriptionInput: CreateTodoInput = {
  title: 'Todo with null description',
  description: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with title and description', async () => {
    const result = await createTodo(basicTestInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with only title (no description)', async () => {
    const result = await createTodo(minimalTestInput);

    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with explicit null description', async () => {
    const result = await createTodo(nullDescriptionInput);

    expect(result.title).toEqual('Todo with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should save todo to database', async () => {
    const result = await createTodo(basicTestInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual('A todo for testing');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple todos with unique IDs', async () => {
    const result1 = await createTodo({ title: 'First Todo' });
    const result2 = await createTodo({ title: 'Second Todo' });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Todo');
    expect(result2.title).toEqual('Second Todo');

    // Verify both are in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
    expect(allTodos.map(t => t.title)).toContain('First Todo');
    expect(allTodos.map(t => t.title)).toContain('Second Todo');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createTodo(basicTestInput);
    const afterCreate = new Date();

    // Verify timestamps are reasonable (within test execution time)
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000); // Allow 1s buffer
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);

    // Initially, created_at and updated_at should be very close or equal
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});