import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './files/files.module';
import { UploadsModule } from './uploads/uploads.module';
import { DownloadsModule } from './downloads/downloads.module';
import { VerifierModule } from './verifier/verifier.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FilesModule,
    UploadsModule,
    DownloadsModule,
    VerifierModule,
    ProjectsModule,
  ],
})
export class AppModule {}
