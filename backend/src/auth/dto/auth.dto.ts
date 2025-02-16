import { IsString, IsEmail } from 'class-validator';
import { Match } from 'src/lib/decorators/isMatch';

export class RegisterLandLordDto {
    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    // add match custom validator later on
    password: string;

    @IsString()
    @Match('password')
    confirmPassword: string;
}

export class LoginDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}