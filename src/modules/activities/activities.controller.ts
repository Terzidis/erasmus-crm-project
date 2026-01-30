import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
  @Get() findAll() { return this.activitiesService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.activitiesService.findOne(+id); }
  @Post() create(@Body() createActivityDto: any) { return this.activitiesService.create(createActivityDto); }
  @Patch(':id') update(@Param('id') id: string, @Body() updateActivityDto: any) { return this.activitiesService.update(+id, updateActivityDto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.activitiesService.remove(+id); }
}
