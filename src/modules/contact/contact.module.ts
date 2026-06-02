import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { AdminContactsController } from './admin-contacts.controller';
import { ContactService } from './contact.service';
import { ContactSubmission } from '../../entities/contact-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactSubmission])],
  controllers: [ContactController, AdminContactsController],
  providers: [ContactService],
})
export class ContactModule {}
