import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminGuard } from 'src/admin/guards/admin.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    search: jest.Mock;
    findOne: jest.Mock;
    createLanguage: jest.Mock;
    getLanguage: jest.Mock;
    findAll: jest.Mock;
    contact: jest.Mock;
    changeLanguage: jest.Mock;
    theme: jest.Mock;
    acceptTerms: jest.Mock;
    changeUsername: jest.Mock;
    changeColor: jest.Mock;
    changeAvatar: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      search: jest.fn(),
      findOne: jest.fn(),
      createLanguage: jest.fn(),
      getLanguage: jest.fn(),
      findAll: jest.fn(),
      contact: jest.fn(),
      changeLanguage: jest.fn(),
      theme: jest.fn(),
      acceptTerms: jest.fn(),
      changeUsername: jest.fn(),
      changeColor: jest.fn(),
      changeAvatar: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    })
      // AdminGuard is referenced via @UseGuards on one route and normally
      // depends on DatabaseService. We never go through the HTTP pipeline in
      // these tests (methods are invoked directly), but Nest still needs the
      // guard resolvable to compile the module, so it is swapped out here.
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('search delegates to the service with the authenticated user id and the name param', () => {
    service.search.mockReturnValueOnce([{ id: 2 }]);
    const result = controller.search(1, 'alice');
    expect(service.search).toHaveBeenCalledWith(1, 'alice');
    expect(result).toEqual([{ id: 2 }]);
  });

  it('me delegates to findOne with the authenticated user id', async () => {
    service.findOne.mockResolvedValueOnce({ id: 1, Username: 'bob' });
    const result = await controller.me(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, Username: 'bob' });
  });

  it('createLanguage delegates to the service with the request body', async () => {
    service.createLanguage.mockResolvedValueOnce({ success: true });
    const body = { en: { hi: 'hello' } };
    const result = await controller.createLanguage(body as any);
    expect(service.createLanguage).toHaveBeenCalledWith(body);
    expect(result).toEqual({ success: true });
  });

  it('getLanguage delegates to the service with the key param', async () => {
    service.getLanguage.mockResolvedValueOnce({ hi: 'hello' });
    const result = await controller.getLanguage('en');
    expect(service.getLanguage).toHaveBeenCalledWith('en');
    expect(result).toEqual({ hi: 'hello' });
  });

  it('findAll delegates to the service with the role query param', async () => {
    service.findAll.mockResolvedValueOnce([{ id: 1 }]);
    const result = await controller.findAll('127.0.0.1', 'ADMIN');
    expect(service.findAll).toHaveBeenCalledWith('ADMIN');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('findOne delegates to the service with the parsed id param', async () => {
    service.findOne.mockResolvedValueOnce({ id: 5 });
    const result = await controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
    expect(result).toEqual({ id: 5 });
  });

  it('contact delegates to the service with the authenticated user id and the message body', async () => {
    service.contact.mockResolvedValueOnce({ email: 'bob@test.com' });
    const result = await controller.contact(1, 'hello there');
    expect(service.contact).toHaveBeenCalledWith(1, 'hello there');
    expect(result).toEqual({ email: 'bob@test.com' });
  });

  it('changeLanguage delegates to the service with the authenticated user id and body', async () => {
    service.changeLanguage.mockResolvedValueOnce({ id: 1, language: 'fr' });
    const result = await controller.changeLanguage(1, { language: 'fr' });
    expect(service.changeLanguage).toHaveBeenCalledWith(1, { language: 'fr' });
    expect(result).toEqual({ id: 1, language: 'fr' });
  });

  it('theme delegates to the service with the authenticated user id and theme flag', async () => {
    service.theme.mockResolvedValueOnce({ id: 1, theme: false });
    const result = await controller.theme(1, false);
    expect(service.theme).toHaveBeenCalledWith(1, false);
    expect(result).toEqual({ id: 1, theme: false });
  });

  it('acceptTerms delegates to the service with the authenticated user id', async () => {
    service.acceptTerms.mockResolvedValueOnce({ id: 1, termsAcceptedAt: new Date() });
    const result = await controller.acceptTerms(1);
    expect(service.acceptTerms).toHaveBeenCalledWith(1);
    expect(result).toBeDefined();
  });

  it('changeUsername delegates to the service with the authenticated user id and body', async () => {
    service.changeUsername.mockResolvedValueOnce({ id: 1, Username: 'newname' });
    const result = await controller.changeUsername(1, { Username: 'newname' });
    expect(service.changeUsername).toHaveBeenCalledWith(1, { Username: 'newname' });
    expect(result).toEqual({ id: 1, Username: 'newname' });
  });

  it('changeColor delegates to the service with the authenticated user id and body', async () => {
    service.changeColor.mockResolvedValueOnce({ id: 1, color: '#000' });
    const result = await controller.changeColor(1, { color: '#000' });
    expect(service.changeColor).toHaveBeenCalledWith(1, { color: '#000' });
    expect(result).toEqual({ id: 1, color: '#000' });
  });

  it('changeAvatar delegates to the service with the authenticated user id and body', async () => {
    service.changeAvatar.mockResolvedValueOnce({ id: 1, avatar: 'a.png' });
    const result = await controller.changeAvatar(1, { avatar: 'a.png' });
    expect(service.changeAvatar).toHaveBeenCalledWith(1, { avatar: 'a.png' });
    expect(result).toEqual({ id: 1, avatar: 'a.png' });
  });

  it('update delegates to the service with the parsed id param and validated dto', async () => {
    service.update.mockResolvedValueOnce({ id: 5, Username: 'updated' });
    const result = await controller.update(5, { Username: 'updated' } as any);
    expect(service.update).toHaveBeenCalledWith(5, { Username: 'updated' });
    expect(result).toEqual({ id: 5, Username: 'updated' });
  });

  it('remove delegates to the service with the parsed id param', async () => {
    service.remove.mockResolvedValueOnce({ id: 5 });
    const result = await controller.remove(5);
    expect(service.remove).toHaveBeenCalledWith(5);
    expect(result).toEqual({ id: 5 });
  });

  it('propagates errors thrown by the service', async () => {
    service.findOne.mockRejectedValueOnce(new Error('boom'));
    await expect(controller.me(1)).rejects.toThrow('boom');
  });
});
