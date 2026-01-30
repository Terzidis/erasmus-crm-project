import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}
  @Get() findAll() { return this.companiesService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.companiesService.findOne(+id); }
  @Post() create(@Body() createCompanyDto: any) { return this.companiesService.create(createCompanyDto); }
  @Patch(':id') update(@Param('id') id: string, @Body() updateCompanyDto: any) { return this.companiesService.update(+id, updateCompanyDto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.companiesService.remove(+id); }
}
