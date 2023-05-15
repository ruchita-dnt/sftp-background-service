import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { TYPES } from "./types";
import { ISFTPService } from "../interfaces/ISFTPService";
import { SFTPService } from "../services/SFTPService";
import { ICronjobService } from "../interfaces/ICronjobService";
import { CronjobService } from "../services/CronjobService";

const iocContainer = new Container();

// make inversify aware of inversify-binding-decorators
iocContainer.load(buildProviderModule());

// Services
iocContainer.bind<ISFTPService>(TYPES.SFTPService).to(SFTPService);
iocContainer.bind<ICronjobService>(TYPES.CronjobService).to(CronjobService);

export { iocContainer };
