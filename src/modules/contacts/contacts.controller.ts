import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}
  @Get() findAll() { return this.contactsService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.contactsService.findOne(+id); }
  @Post() create(@Body() createContactDto: any) { return this.contactsService.create(createContactDto); }
  @Patch(':id') update(@Param('id') id: string, @Body() updateContactDto: any) { return this.contactsService.update(+id, updateContactDto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.contactsService.remove(+id); }
}
