import {
  ConflictException,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entity/user.entity';
import {
  fieldsToUpdateDto,
  FindUserDto,
  UpdateUserByIdDto,
  UpdateUserPermissionBodyDto,
  UserSignupDto,
} from './dto/user-request.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async getAllUsers() {
    return this.userRepository.find({});
  }

  async update(
    email: string,
    fields: fieldsToUpdateDto,
  ): Promise<UserEntity | undefined> {
    // check what all use is asking to update
    if (fields.email) {
      const duplicateUser = await this.findOneByEmail(fields.email);
      if (duplicateUser) {
        // reset value as we don't allow duplicate
        fields.email = undefined;
      }
    }
    const fieldToUpdate: Partial<UserEntity> = {};

    if (fields.password_update && fields.password_update.new_password) {
      // check if old password passed here is correct with email
      // we can check that with auth service
      // user wants to update password
      // validate if user exists with this email and password
      // This will throw NotFoundException if credentials are invalid
      await this.authService.validateUserByPassword({
        email,
        password: fields.password_update.old_password,
      });
      // If validation succeeds, hash and update the password
      const hashedPassword = await this.hashPassword(
        fields.password_update.new_password,
      );
      fieldToUpdate.password = hashedPassword;
    }

    // Copy other fields from DTO (excluding password_update)
    if (fields.email !== undefined) fieldToUpdate.email = fields.email;
    if (fields.first_name !== undefined)
      fieldToUpdate.first_name = fields.first_name;
    if (fields.last_name !== undefined)
      fieldToUpdate.last_name = fields.last_name;
    let user: UserEntity | undefined | null;
    // now we have final payload to push for update
    if (Object.entries(fieldToUpdate).length > 0) {
      user = await this.findOneByEmail(email.toLowerCase());
      const saveEntity = { ...user, ...fieldToUpdate };
      await this.userRepository.save(saveEntity);
    }
    // return updated user
    user = await this.findOneByEmail(email);
    return user || undefined;
  }

  async findOneByUserId(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  async hashData(token: string): Promise<string> {
    return await hash(token, 10);
  }

  async updateRefreshTokenByEmail(email: string, refToken: string | null) {
    if (!refToken) {
      const user = await this.findOneByEmail(email.toLowerCase());
      const saveEntity = { ...user, refresh_token: undefined };
      return await this.userRepository.save(saveEntity);
    }
    const hashedToken = await this.hashData(refToken);
    const user = await this.findOneByEmail(email.toLowerCase());
    const saveEntity = { ...user, refresh_token: hashedToken };
    return await this.userRepository.save(saveEntity);
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findOneByEmailWithRefreshToken(
    email: string,
  ): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'first_name',
        'last_name',
        'name',
        'refresh_token',
        'permissions',
        'created_at',
        'updated_at',
      ],
    });
  }

  async findUserByProperty(data: FindUserDto) {
    const { email, first_name, last_name, name } = data;
    const users = await this.userRepository.find({
      where: [
        { name: Like(`%${name}%`) },
        { email: Like(`%${email}%`) },
        { first_name: Like(`%${first_name}%`) },
        { last_name: Like(`%${last_name}%`) },
      ],
    });
    return users;
  }

  async assignUserPermissions(
    param: UpdateUserByIdDto,
    payload: UpdateUserPermissionBodyDto,
  ) {
    const { id } = param;
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException();
    }
    user.permissions = payload.permissions;
    return await user.save();
  }

  async create(userInput: UserSignupDto): Promise<UserEntity> {
    const userEntity = this.userRepository.create();
    const { email } = userInput;
    const existingUser = await this.findOneByEmail(email.toLowerCase());
    if (existingUser) {
      throw new ConflictException('user with email already exists');
    }
    const hashPassword = await this.hashPassword(userInput.password);
    const saveEntity = {
      ...userEntity,
      ...userInput,
      password: hashPassword,
      first_name: userInput?.first_name?.toLowerCase(),
      last_name: userInput?.last_name?.toLowerCase(),
      email: userInput?.email.toLowerCase(),
    };

    try {
      return await this.userRepository.save(saveEntity);
    } catch (err) {
      console.error(err);
      throw new ConflictException(`user already exist with same email`);
    }
  }
  async hashPassword(password: string): Promise<string> {
    return await hash(password, 10);
  }
}
