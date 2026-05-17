import { Injectable } from '@nestjs/common';
import { DmsAdapter } from './adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';
import { OdooAdapter } from './adapters/odoo.adapter';
import { SapB1Adapter } from './adapters/sap-b1.adapter';
import { Dynamics365Adapter } from './adapters/dynamics-365.adapter';
import { CustomApiAdapter } from './adapters/custom.adapter';

@Injectable()
export class DmsRegistry {
  private readonly adapters: Record<DmsAdapterKind, DmsAdapter>;

  constructor(
    odoo: OdooAdapter,
    sap: SapB1Adapter,
    dynamics: Dynamics365Adapter,
    custom: CustomApiAdapter
  ) {
    this.adapters = {
      [DmsAdapterKind.ODOO]: odoo,
      [DmsAdapterKind.SAP_B1]: sap,
      [DmsAdapterKind.DYNAMICS_365]: dynamics,
      [DmsAdapterKind.CUSTOM]: custom,
    };
  }

  get(kind: DmsAdapterKind): DmsAdapter {
    return this.adapters[kind];
  }

  defaultKind(): DmsAdapterKind {
    const v = (process.env.DMS_DEFAULT_ADAPTER ?? 'odoo').toUpperCase();
    switch (v) {
      case 'SAP_B1':
        return DmsAdapterKind.SAP_B1;
      case 'DYNAMICS_365':
        return DmsAdapterKind.DYNAMICS_365;
      case 'CUSTOM':
        return DmsAdapterKind.CUSTOM;
      default:
        return DmsAdapterKind.ODOO;
    }
  }
}
