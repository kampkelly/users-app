import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AvatarDocument = HydratedDocument<Avatar>;

@Schema()
export class Avatar {
  @Prop()
  userId: string;

  @Prop()
  hash: string;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
