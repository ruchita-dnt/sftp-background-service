import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { TYPES } from "./types";
import { ISFTPService } from "../interfaces/ISFTPService";
import { SFTPService } from "../services/SFTPService";
import { ICronjobService } from "../interfaces/ICronjobService";
import { CronjobService } from "../services/CronjobService";
import { IFilereceiverService } from "../interfaces/IFilereceiverService";
import { FilereceiverService } from "../services/FilereceiverService";
import { IGCPService } from "../interfaces/IGCPService";
import { GCPService } from "../services/GCPService";

const iocContainer = new Container();

// make inversify aware of inversify-binding-decorators
iocContainer.load(buildProviderModule());

// Services
iocContainer.bind<ISFTPService>(TYPES.SFTPService).to(SFTPService);
iocContainer.bind<ICronjobService>(TYPES.CronjobService).to(CronjobService);
iocContainer
  .bind<IFilereceiverService>(TYPES.FilereceiverService)
  .to(FilereceiverService);
iocContainer.bind<IGCPService>(TYPES.GCPService).to(GCPService);

export { iocContainer };
