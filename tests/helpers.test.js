import { describe, it, expect } from '@jest/globals';
import { ApiResponse, PaginationHelper, SortHelper, IDGenerator } from '../src/server/utils/helpers.js';

describe('ApiResponse', () => {
  it('should create a success response', () => {
    const { response, statusCode } = ApiResponse.success({ id: 1 }, 'Success message');
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: 1 });
    expect(response.message).toBe('Success message');
    expect(statusCode).toBe(200);
  });

  it('should create an error response', () => {
    const { response, statusCode } = ApiResponse.error('Error message');
    
    expect(response.success).toBe(false);
    expect(response.data).toBe(null);
    expect(response.message).toBe('Error message');
    expect(statusCode).toBe(500);
  });

  it('should create a not found response', () => {
    const { response, statusCode } = ApiResponse.notFound('Resource not found');
    
    expect(response.success).toBe(false);
    expect(response.message).toBe('Resource not found');
    expect(statusCode).toBe(404);
  });
});

describe('PaginationHelper', () => {
  const testData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it('should paginate data correctly', () => {
    const result = PaginationHelper.paginate(testData, 1, 10);
    
    expect(result.data).toHaveLength(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(false);
  });

  it('should handle last page correctly', () => {
    const result = PaginationHelper.paginate(testData, 3, 10);
    
    expect(result.data).toHaveLength(5);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPrevPage).toBe(true);
  });
});

describe('SortHelper', () => {
  const testData = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
  ];

  it('should sort by string field ascending', () => {
    const sorted = SortHelper.sort(testData, 'name', 'asc');
    
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should sort by number field descending', () => {
    const sorted = SortHelper.sort(testData, 'age', 'desc');
    
    expect(sorted[0].age).toBe(35);
    expect(sorted[1].age).toBe(30);
    expect(sorted[2].age).toBe(25);
  });

  it('should handle null sortBy', () => {
    const sorted = SortHelper.sort(testData, null);
    
    expect(sorted).toEqual(testData);
  });
});

describe('IDGenerator', () => {
  it('should generate unique IDs', () => {
    const id1 = IDGenerator.generate('TEST');
    const id2 = IDGenerator.generate('TEST');
    
    expect(id1).toContain('TEST-');
    expect(id2).toContain('TEST-');
    expect(id1).not.toBe(id2);
  });

  it('should generate ID without prefix', () => {
    const id = IDGenerator.generate();
    
    expect(id).toBeTruthy();
    expect(id).not.toContain('-');
  });
});
