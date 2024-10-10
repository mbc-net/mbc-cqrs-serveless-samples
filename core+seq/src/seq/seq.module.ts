import { SequencesModule } from '@mbc-cqrs-serverless/sequence'
import { Module } from '@nestjs/common'

@Module({
  imports: [SequencesModule.register({ enableController: false })],
  exports: [SequencesModule],
})
export class SeqModule {}
