import { IsString, IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
export class CreatePrivateGameRoom {
  @IsString()
  @IsNotEmpty()
  'name': string;

  @IsNumber()
  'maxUsers': number;

  @IsNumber()
  'ownerId': number;

  @IsEnum(['PRIVATE', 'PUBLIC'], {
    message: 'Valid role required',
  })
  
  'type': 'PRIVATE' | 'PUBLIC';
}
