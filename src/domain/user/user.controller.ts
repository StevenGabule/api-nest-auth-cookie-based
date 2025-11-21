/* eslint-disable @typescript-eslint/no-unsafe-argument */
// Native.

// Package.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access_token.guard';
import { RoleAllowed } from '../auth/guards/role-decorator';
import { RolesGuard } from '../auth/guards/role-guard';
import {
  FindUserDto,
  UpdateUserByIdDto,
  UpdateUserPermissionBodyDto,
  UserSignupDto,
  fieldsToUpdateDto,
} from './dto/user-request.dto';
import { UserSignupResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';
import { User } from '../auth/guards/user';
import { UserEntity } from './entity/user.entity';

import { UserRoles } from '../auth/auth.dto';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NO_ENTITY_FOUND,
  UNAUTHORIZED_REQUEST,
} from 'src/app.constants';

@ApiBearerAuth('authorization')
@Controller('users')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: UserSignupResponseDto,
    description: 'user created successfully',
  })
  @ApiOkResponse({ type: UserSignupResponseDto, description: '' })
  @ApiOperation({ description: 'user create api ' })
  @ApiConsumes('application/json')
  @Post('')
  public async CreateUser(@Body() body: UserSignupDto) {
    return this.userService.create(body);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: UserSignupResponseDto,
    description: 'user updated successfully',
  })
  @ApiOkResponse({ type: UserSignupResponseDto, description: '' })
  @ApiOperation({ description: 'user update api ' })
  @ApiConsumes('application/json')
  @Put('/:id')
  public async UpdateUser(@Body() body: fieldsToUpdateDto) {
    return this.userService.update(body.email || '', body);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @RoleAllowed(UserRoles['system-admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserSignupResponseDto, description: '' })
  @ApiOperation({ description: 'find users based on props ' })
  @ApiConsumes('application/json')
  @Get('/search')
  public async findUser(@Param() param: FindUserDto) {
    return this.userService.findUserByProperty(param);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @RoleAllowed(UserRoles['system-admin'])
  @ApiConsumes('application/json')
  @ApiNotFoundResponse({ description: NO_ENTITY_FOUND })
  @ApiForbiddenResponse({ description: UNAUTHORIZED_REQUEST })
  @ApiUnprocessableEntityResponse({ description: BAD_REQUEST })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR })
  @ApiOkResponse({ description: 'assign permissions' })
  @ApiOperation({
    description: 'assign permission to user',
  })
  @ApiOkResponse({
    description: 'assign permissions to the user',
  })
  @ApiConsumes('application/json')
  @Put('/assign-permissions/:id')
  public async assignUserPermissions(
    @Param() param: UpdateUserByIdDto,
    @Body() payload: UpdateUserPermissionBodyDto,
  ) {
    return this.userService.assignUserPermissions(param, payload);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @RoleAllowed(UserRoles['system-root'])
  @ApiConsumes('application/json')
  @ApiNotFoundResponse({ description: NO_ENTITY_FOUND })
  @ApiForbiddenResponse({ description: UNAUTHORIZED_REQUEST })
  @ApiUnprocessableEntityResponse({ description: BAD_REQUEST })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR })
  @ApiOkResponse({ description: 'users returned successfully' })
  @ApiOperation({
    description: 'get all Users',
  })
  @ApiOkResponse({
    description: 'return users details',
  })
  @ApiConsumes('application/json')
  @Get('/')
  public async allUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @ApiNotFoundResponse({ description: NO_ENTITY_FOUND })
  @ApiForbiddenResponse({ description: UNAUTHORIZED_REQUEST })
  @ApiUnprocessableEntityResponse({ description: BAD_REQUEST })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR })
  @ApiOkResponse({ description: 'user returned successfully' })
  @ApiOperation({
    description: 'get current session User',
  })
  @ApiOkResponse({
    description: 'return session user details',
  })
  @Get('/profile')
  public getUser(@User() user: UserEntity) {
    return user;
  }
}
