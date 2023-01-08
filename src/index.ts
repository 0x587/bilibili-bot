import { Command } from 'commander'
import pkg from '../package.json'
import { User } from './core/user'

const program = new Command(pkg.name)

const user = new User()

program.command('login').description('登录账号').action(user.login)

program.parse(process.argv)
