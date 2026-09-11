import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVote } from '../../entities/app-vote.entity';
import { Post } from '../../entities/post.entity';
import { AdminVotesController, VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppVote, Post])],
  controllers: [VotesController, AdminVotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
