import 'reflect-metadata';
import bcrypt from 'bcrypt';
import * as typeorm from 'typeorm';
import { IUserCreateDTO } from '../src/interfaces/user.interface';
import { User } from '../dist/entities/User';
import UserService from '../src/services/UserService';

jest.mock('bcrypt');

(typeorm as any).getRepository = jest.fn();

describe('UserService.signUp', () => {

  const testUser: IUserCreateDTO = {
    firstName: 'TestFirstName',
    lastName: 'TestLastName',
    username: 'TestUsername',
    email: 'TestEmail@example.com',
    password: 'TestPassword',
  };

  const serviceInstance = new UserService();

  test(
    'send exist username -> throw DUPLICATE_USERNAME',
    async () => {
      expect.assertions(2);

      const mockFindOne = jest.fn().mockResolvedValue(true);
      const mockMerge = jest.fn().mockResolvedValue(testUser);

      (typeorm as any).getRepository.mockImplementationOnce(() => {
        return {
          findOne: mockFindOne,
          merge: mockMerge,
        };
      });

      await expect(serviceInstance.signup(testUser)).rejects.toThrowError('DUPLICATE_USERNAME');
      expect((typeorm as any).getRepository).toHaveBeenCalled();
    },
  );

  test(
    'send exist email -> throw DUPLICATE_EMAIL',
    async () => {
      expect.assertions(2);

      (typeorm as any).getRepository.mockImplementationOnce(() => {
        return {
          findOne: jest.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true),
          merge: jest.fn().mockResolvedValueOnce(testUser),
        };
      });

      await expect(serviceInstance.signup(testUser)).rejects.toThrowError('DUPLICATE_EMAIL');
      expect((typeorm as any).getRepository).toHaveBeenCalled();
    },
  );

  test(
    'send correct data when server can\'t save to db -> throw INVALID_DATA',
    async () => {
      expect.assertions(2);

      (typeorm as any).getRepository.mockImplementationOnce(() => {
        return {
          findOne: jest.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(false),
          merge: jest.fn().mockResolvedValueOnce(testUser),
        };
      });

      serviceInstance.generateUniqueToken = jest.fn().mockReturnValue('token');

      await expect(serviceInstance.signup(testUser)).rejects.toThrowError('SERVER_ERR');
      expect((typeorm as any).getRepository).toHaveBeenCalled();
    },
  );
});
