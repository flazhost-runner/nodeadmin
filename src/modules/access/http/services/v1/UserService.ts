import { In, Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { Role } from '../../../models/role.entity'
import { User } from '../../../models/user.entity'
import bcrypt from 'bcryptjs'
import { Functions as functions, removePrefix, ciLike, paginate } from '@flazhost-nodeadmin/core'
import fileService from '../../../../../services/fileService'
import { v6 as uuidv6 } from 'uuid'
import Module from '../../../Module'
import { IUserService } from './IUserService'
import { TOKENS } from '../../../../../tokens'
import { AppError, NotFoundError } from '@flazhost-nodeadmin/core'

@injectable()
export default class UserService implements IUserService {
  // Dual-mode: prod inject token; test `new UserService()` pakai default param.
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: Repository<User> = AppDataSource.getRepository(User),
    @inject(TOKENS.RoleRepository) private roleRepository: Repository<Role> = AppDataSource.getRepository(Role),
  ) {}

  public async index(filter: any) {
    const cleanConditions = removePrefix(filter, 'q_')
    let query = this.userRepository.createQueryBuilder('users')

    // relations
    query = query.leftJoinAndSelect('users.roles','roles')

    // filter
    if (cleanConditions.code) {
      query = query.andWhere(...ciLike('users.code', 'code', cleanConditions.code))
    }
    if (cleanConditions.name) {
      query = query.andWhere(...ciLike('users.name', 'name', cleanConditions.name))
    }
    if (cleanConditions.phone) {
      query = query.andWhere(...ciLike('users.phone', 'phone', cleanConditions.phone))
    }
    if (cleanConditions.email) {
      query = query.andWhere(...ciLike('users.email', 'email', cleanConditions.email))
    }
    if (cleanConditions.status) {
      query = query.andWhere(`users.status = :status`, { status: cleanConditions.status })
    }
    if (cleanConditions.role) {
      query = query.andWhere(`roles.id = :roles_id`, { roles_id: cleanConditions.role })
    }

    const result = await paginate(query, cleanConditions)
    const roles = await this.roleRepository.find()
    return { ...result, roles }
  }

  public async create() {
    const roles = await this.roleRepository.find()
    return roles
  }

  public async store(request: any, files: any = null, forRegister: boolean = false) {
    request.id = uuidv6()
    let roles;
    if (forRegister) {
      roles = await this.roleRepository.findBy({ name: "User" })
    } else {
      roles = await this.roleRepository.findBy({ id: In(request.roles) })
      if (!roles.length) {
        throw new NotFoundError("Roles Not Found")
      }
    }
    if (Array.isArray(files) && files.length > 0) {
      const fileName = request.id
      await Promise.all(
        files.map((file: { originalname: string; buffer: Buffer }) => {
          const uploadPath = Module.filePath + "user/" + fileName + "." + file.originalname.split('.').pop()!.toLowerCase()
          return fileService.uploadFile(uploadPath, file.buffer).then((savedName: string) => {
            request.picture = savedName
          })
        })
      )
    }
    request = functions.removeEmptyFields(request)
    request.password = await bcrypt.hash(request.password, 10)
    const user = this.userRepository.create({ ...request, roles })
    const result = await this.userRepository.save(user)
    if (!result) {
      throw new AppError("Store User Fail", 500)
    }
    return result
  }

  public async edit(id: string) {
    const roles = await this.roleRepository.find()
    const data = await this.userRepository.findOne({ where: { id }, relations: ['roles'] })
    return { data, roles }
  }

  public async update(id: string, request: any, files: any = null) {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundError('User not found')
    }
    const roles = await this.roleRepository.findBy({ id: In(request.roles) })
    if (!roles.length) {
      throw new NotFoundError("Roles Not Found")
    }
    request = functions.removeEmptyFields(request)
    if (typeof request.password !== 'undefined') {
      request.password = await bcrypt.hash(request.password, 10)
    }
    if (Array.isArray(files) && files.length > 0) {
      const fileName = id
      await Promise.all(
        files.map((file: { originalname: string; buffer: Buffer }) => {
          const uploadPath = Module.filePath + "user/" + fileName + "." + file.originalname.split('.').pop()!.toLowerCase()
          return fileService.uploadFile(uploadPath, file.buffer).then((savedName: string) => {
            request.picture = savedName
          })
        })
      )
    }
    const data = this.userRepository.merge(user, { ...request, roles })
    const result = await this.userRepository.save(data)
    if (!result) {
      throw new AppError("Update User Fail", 500)
    }
    return result
  }

  public async updateProfile(id: string, request: any, files: any = null) {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['roles'] })
    if (!user) {
      throw new NotFoundError('User not found')
    }
    request = functions.removeEmptyFields(request)
    if (typeof request.password !== 'undefined') {
      request.password = await bcrypt.hash(request.password, 10)
    }
    if (Array.isArray(files) && files.length > 0) {
      const fileName = id
      await Promise.all(
        files.map((file: { originalname: string; buffer: Buffer }) => {
          const uploadPath = Module.filePath + "user/" + fileName + "." + file.originalname.split('.').pop()!.toLowerCase()
          return fileService.uploadFile(uploadPath, file.buffer).then((savedName: string) => {
            request.picture = savedName
          })
        })
      )
    }
    // Do not touch roles in profile update
    const data = this.userRepository.merge(user, { ...request })
    const result = await this.userRepository.save(data)
    if (!result) {
      throw new AppError("Update Profile Fail", 500)
    }
    return result
  }

  public async delete(id: string) {
    const data = await this.userRepository.findOne({ where: { id } })
    if (!data) {
      throw new NotFoundError('User not found')
    }
    await fileService.deleteFile(data.picture)
    const result = await this.userRepository.remove(data)
    return result
  }
}
