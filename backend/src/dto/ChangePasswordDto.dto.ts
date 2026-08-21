import { IsString, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
    @IsString()  @IsNotEmpty()
    "OldPassword": string;
    
    @IsString()  @IsNotEmpty()
    "NewPassword": string;
}
