import { DmsRegistry } from './dms.registry';
import { OdooAdapter } from './adapters/odoo.adapter';
import { SapB1Adapter } from './adapters/sap-b1.adapter';
import { Dynamics365Adapter } from './adapters/dynamics-365.adapter';
import { CustomApiAdapter } from './adapters/custom.adapter';
import { DmsAdapterKind } from '@teletrade/shared';

describe('DmsRegistry', () => {
  const registry = new DmsRegistry(new OdooAdapter(), new SapB1Adapter(), new Dynamics365Adapter(), new CustomApiAdapter());

  it('resolves each adapter kind', () => {
    expect(registry.get(DmsAdapterKind.ODOO).kind).toBe('ODOO');
    expect(registry.get(DmsAdapterKind.SAP_B1).kind).toBe('SAP_B1');
    expect(registry.get(DmsAdapterKind.DYNAMICS_365).kind).toBe('DYNAMICS_365');
    expect(registry.get(DmsAdapterKind.CUSTOM).kind).toBe('CUSTOM');
  });

  it('defaults to ODOO when env unset', () => {
    delete process.env.DMS_DEFAULT_ADAPTER;
    expect(registry.defaultKind()).toBe('ODOO');
  });

  it('honours DMS_DEFAULT_ADAPTER env var', () => {
    process.env.DMS_DEFAULT_ADAPTER = 'sap_b1';
    expect(registry.defaultKind()).toBe('SAP_B1');
    process.env.DMS_DEFAULT_ADAPTER = 'dynamics_365';
    expect(registry.defaultKind()).toBe('DYNAMICS_365');
    delete process.env.DMS_DEFAULT_ADAPTER;
  });
});
