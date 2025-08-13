import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';
import { eq } from 'drizzle-orm';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second description',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const todo3 = await db.insert(todosTable)
      .values({
        title: 'Third Todo',
        description: null, // Test null description
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    // Should return 3 todos
    expect(result).toHaveLength(3);

    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('Third Todo');
    expect(result[1].title).toEqual('Second Todo');
    expect(result[2].title).toEqual('First Todo');

    // Verify all field types and values
    result.forEach(todo => {
      expect(typeof todo.id).toBe('number');
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
      // Description can be string or null
      expect(todo.description === null || typeof todo.description === 'string').toBe(true);
    });

    // Verify specific todo properties
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
    expect(result[1].description).toEqual('Second description');
    expect(result[1].completed).toBe(true);
    expect(result[2].description).toEqual('First description');
    expect(result[2].completed).toBe(false);
  });

  it('should handle todos with various completion states', async () => {
    // Create todos with different completion states
    await db.insert(todosTable)
      .values([
        {
          title: 'Completed Todo',
          description: 'This is done',
          completed: true
        },
        {
          title: 'Incomplete Todo',
          description: 'This is not done',
          completed: false
        },
        {
          title: 'Default Todo',
          description: 'Default completion state'
          // completed will default to false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);

    // Check completion states
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);

    expect(completedTodos).toHaveLength(1);
    expect(incompleteTodos).toHaveLength(2);

    // Verify the completed todo
    expect(completedTodos[0].title).toEqual('Completed Todo');
    expect(completedTodos[0].completed).toBe(true);
  });

  it('should handle todos with null descriptions correctly', async () => {
    await db.insert(todosTable)
      .values([
        {
          title: 'Todo with description',
          description: 'Has description',
          completed: false
        },
        {
          title: 'Todo without description',
          description: null,
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);

    // Find todos by title to avoid order dependency
    const withDescription = result.find(todo => todo.title === 'Todo with description');
    const withoutDescription = result.find(todo => todo.title === 'Todo without description');

    expect(withDescription).toBeDefined();
    expect(withoutDescription).toBeDefined();

    expect(withDescription!.description).toEqual('Has description');
    expect(withoutDescription!.description).toBeNull();
  });

  it('should verify database persistence', async () => {
    const insertedTodo = await db.insert(todosTable)
      .values({
        title: 'Persistence Test',
        description: 'Testing database persistence',
        completed: false
      })
      .returning()
      .execute();

    // Fetch via handler
    const handlerResult = await getTodos();

    // Fetch directly from database for comparison
    const dbResult = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, insertedTodo[0].id))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);

    // Handler result should match database result
    const handlerTodo = handlerResult[0];
    const dbTodo = dbResult[0];

    expect(handlerTodo.id).toEqual(dbTodo.id);
    expect(handlerTodo.title).toEqual(dbTodo.title);
    expect(handlerTodo.description).toEqual(dbTodo.description);
    expect(handlerTodo.completed).toEqual(dbTodo.completed);
    expect(handlerTodo.created_at).toEqual(dbTodo.created_at);
    expect(handlerTodo.updated_at).toEqual(dbTodo.updated_at);
  });
});