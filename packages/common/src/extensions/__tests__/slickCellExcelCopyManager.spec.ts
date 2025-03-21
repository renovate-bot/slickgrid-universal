import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { EditCommand, Formatter, GridOption } from '../../interfaces/index.js';
import { SharedService } from '../../services/shared.service.js';
import { SlickCellExcelCopyManager } from '../slickCellExcelCopyManager.js';
import type { SlickCellSelectionModel } from '../slickCellSelectionModel.js';
import type { SlickCellExternalCopyManager } from '../slickCellExternalCopyManager.js';
import { SlickEvent, SlickEventData, type SlickGrid, type SlickRange } from '../../core/index.js';
import { Editors } from '../../editors/index.js';

const getEditorLockMock = {
  isActive: vi.fn(),
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  getData: vi.fn(),
  getOptions: vi.fn(),
  getSelectionModel: vi.fn(),
  getActiveCell: vi.fn(),
  getCellEditor: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  focus: vi.fn(),
  registerPlugin: vi.fn(),
  setSelectionModel: vi.fn(),
  onKeyDown: new SlickEvent(),
} as unknown as SlickGrid;

const mockCellExternalCopyManager = {
  constructor: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getHeaderValueForColumn: vi.fn(),
  getDataItemValueForColumn: vi.fn(),
  setDataItemValueForColumn: vi.fn(),
  onCopyCells: new SlickEvent(),
  onCopyCancelled: new SlickEvent(),
  onPasteCells: new SlickEvent(),
} as unknown as SlickCellExternalCopyManager;

const mockCellSelectionModel = {
  constructor: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickCellSelectionModel;

vi.mock('../slickCellSelectionModel', () => ({
  SlickCellSelectionModel: vi.fn().mockImplementation(() => mockCellSelectionModel),
}));
vi.mock('../slickCellExternalCopyManager', () => ({
  SlickCellExternalCopyManager: vi.fn().mockImplementation(() => mockCellExternalCopyManager),
}));

describe('CellExcelCopyManager', () => {
  let queueCallback: EditCommand;
  const mockEventCallback = () => {};
  const mockSelectRange = [{ fromCell: 1, fromRow: 1, toCell: 1, toRow: 1 }] as SlickRange[];
  const mockSelectRangeEvent = { ranges: mockSelectRange };
  const myBoldFormatter: Formatter = (_row, _cell, value) => (value ? `<b>${value}</b>` : (null as any));

  let plugin: SlickCellExcelCopyManager;
  const gridOptionsMock = {
    editable: true,
    enableCheckboxSelector: true,
    excelCopyBufferOptions: {
      onExtensionRegistered: vi.fn(),
      onCopyCells: mockEventCallback,
      onCopyCancelled: mockEventCallback,
      onPasteCells: mockEventCallback,
    },
  } as GridOption;

  beforeEach(() => {
    plugin = new SlickCellExcelCopyManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      queueCallback = {
        execute: () => {},
        undo: () => {},
        row: 0,
        cell: 0,
        editor: {},
        serializedValue: 'serialize',
        prevSerializedValue: 'previous',
      };
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
    });

    it('should initialize CellExcelCopyManager', () => {
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectionModel');
      const cellExternalCopyInitSpy = vi.spyOn(mockCellExternalCopyManager, 'init');

      plugin.init(gridStub);

      const expectedAddonOptions = {
        clipboardCommandHandler: expect.anything(),
        dataItemColumnValueExtractor: expect.anything(),
        newRowCreator: expect.anything(),
        includeHeaderWhenCopying: false,
        readOnlyMode: false,
        removeDoubleQuotesOnPaste: false,
        replaceNewlinesWith: false,
      };
      expect(plugin.addonOptions).toEqual(expectedAddonOptions);
      expect(plugin.gridOptions).toEqual(gridOptionsMock);
      expect(setSelectionSpy).toHaveBeenCalledWith(mockCellSelectionModel);
      expect(cellExternalCopyInitSpy).toHaveBeenCalledWith(gridStub, expectedAddonOptions);
    });

    it('should call internal event handler subscribe and expect the "onCopyCells" option to be called when addon notify is called', () => {
      const handlerSpy = vi.spyOn(plugin.eventHandler, 'subscribe');
      const mockOnCopy = vi.fn();
      const mockOnCopyCancel = vi.fn();
      const mockOnPasteCell = vi.fn();

      plugin.init(gridStub, { onCopyCells: mockOnCopy, onCopyCancelled: mockOnCopyCancel, onPasteCells: mockOnPasteCell });
      mockCellExternalCopyManager.onCopyCells.notify(mockSelectRangeEvent, new SlickEventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(handlerSpy).toHaveBeenCalledWith(expect.any(SlickEvent), expect.anything());
      expect(mockOnCopy).toHaveBeenCalledWith(expect.anything(), mockSelectRangeEvent);
      expect(mockOnCopyCancel).not.toHaveBeenCalled();
      expect(mockOnPasteCell).not.toHaveBeenCalled();
    });

    it('should call internal event handler subscribe and expect the "onCopyCancelled" option to be called when addon notify is called', () => {
      const handlerSpy = vi.spyOn(plugin.eventHandler, 'subscribe');
      const mockOnCopy = vi.fn();
      const mockOnCopyCancel = vi.fn();
      const mockOnPasteCell = vi.fn();

      plugin.init(gridStub, { onCopyCells: mockOnCopy, onCopyCancelled: mockOnCopyCancel, onPasteCells: mockOnPasteCell });
      mockCellExternalCopyManager.onCopyCancelled.notify(mockSelectRangeEvent, new SlickEventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(handlerSpy).toHaveBeenCalledWith(expect.any(SlickEvent), expect.anything());
      expect(mockOnCopy).not.toHaveBeenCalledWith(expect.anything(), mockSelectRangeEvent);
      expect(mockOnCopyCancel).toHaveBeenCalled();
      expect(mockOnPasteCell).not.toHaveBeenCalled();
    });

    it('should call internal event handler subscribe and expect the "onPasteCells" option to be called when addon notify is called', () => {
      const handlerSpy = vi.spyOn(plugin.eventHandler, 'subscribe');
      const mockOnCopy = vi.fn();
      const mockOnCopyCancel = vi.fn();
      const mockOnPasteCell = vi.fn();

      plugin.init(gridStub, { onCopyCells: mockOnCopy, onCopyCancelled: mockOnCopyCancel, onPasteCells: mockOnPasteCell });
      mockCellExternalCopyManager.onPasteCells.notify(mockSelectRangeEvent, new SlickEventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(handlerSpy).toHaveBeenCalledWith(expect.any(SlickEvent), expect.anything());
      expect(mockOnCopy).not.toHaveBeenCalledWith(expect.anything(), mockSelectRangeEvent);
      expect(mockOnCopyCancel).not.toHaveBeenCalled();
      expect(mockOnPasteCell).toHaveBeenCalled();
    });
  });

  describe('createUndoRedo private method', () => {
    it('should create the UndoRedoBuffer', () => {
      plugin.init(gridStub);

      expect(plugin.undoRedoBuffer).toEqual({
        queueAndExecuteCommand: expect.anything(),
        undo: expect.anything(),
        redo: expect.anything(),
      });
    });

    it('should have called Edit Command "execute" method after creating the UndoRedoBuffer', () => {
      plugin.init(gridStub);
      const undoRedoBuffer = plugin.undoRedoBuffer;

      const spy = vi.spyOn(queueCallback, 'execute');
      undoRedoBuffer.queueAndExecuteCommand(queueCallback);

      expect(spy).toHaveBeenCalled();
    });

    it('should not have called Edit Command "undo" method when there is nothing to undo', () => {
      plugin.init(gridStub);
      const undoRedoBuffer = plugin.undoRedoBuffer;

      const spy = vi.spyOn(queueCallback, 'undo');
      undoRedoBuffer.undo();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have called Edit Command "undo" method after calling it from UndoRedoBuffer', () => {
      plugin.init(gridStub);
      const undoRedoBuffer = plugin.undoRedoBuffer;

      const spy = vi.spyOn(queueCallback, 'undo');
      undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      undoRedoBuffer.undo();

      expect(spy).toHaveBeenCalled();
    });

    it('should have called Edit Command "execute" method only at first queueing, the "redo" should not call the "execute" method by itself', () => {
      plugin.init(gridStub);
      const undoRedoBuffer = plugin.undoRedoBuffer;

      const spy = vi.spyOn(queueCallback, 'execute');
      undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      undoRedoBuffer.redo();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should have called Edit Command "execute" method at first queueing & then inside the "redo" since we did an "undo" just before', () => {
      plugin.init(gridStub);
      const undoRedoBuffer = plugin.undoRedoBuffer;

      const spy = vi.spyOn(queueCallback, 'execute');
      undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      undoRedoBuffer.undo();
      undoRedoBuffer.redo();

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should have a single entry in the queue buffer after calling "queueAndExecuteCommand" once', () => {
      plugin.init(gridStub);
      plugin.undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      expect(plugin.commandQueue).toHaveLength(1);
    });

    it('should call a redo when Ctrl+Shift+Z keyboard event occurs', () => {
      plugin.init(gridStub);
      const spy = vi.spyOn(queueCallback, 'execute');

      plugin.undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      const body = window.document.body;
      body.dispatchEvent(
        new (window.window as any).KeyboardEvent('keydown', {
          key: 'Z',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        })
      );

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should call a undo when Ctrl+Z keyboard event occurs', () => {
      plugin.init(gridStub);
      const spy = vi.spyOn(queueCallback, 'undo');

      plugin.undoRedoBuffer.queueAndExecuteCommand(queueCallback);
      const body = window.document.body;
      body.dispatchEvent(
        new (window.window as any).KeyboardEvent('keydown', {
          key: 'Z',
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
        })
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('addonOptions callbacks', () => {
    it('should expect "queueAndExecuteCommand" to be called after calling "clipboardCommandHandler" callback', () => {
      plugin.init(gridStub);
      const spy = vi.spyOn(plugin.undoRedoBuffer, 'queueAndExecuteCommand');

      plugin.addonOptions!.clipboardCommandHandler!(queueCallback);

      expect(spy).toHaveBeenCalled();
    });

    it('should expect "addItem" method to be called after calling "newRowCreator" callback', () => {
      plugin.init(gridStub);
      const mockGetData = { addItem: vi.fn() };
      const getDataSpy = vi.spyOn(gridStub, 'getData').mockReturnValue(mockGetData as any);
      const addItemSpy = vi.spyOn(mockGetData, 'addItem');

      plugin.addonOptions!.newRowCreator!(2);

      expect(getDataSpy).toHaveBeenCalled();
      expect(addItemSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'newRow_0' }));
      expect(addItemSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'newRow_1' }));
    });

    it('should respect datasetIdPropertyName when calling "newRowCreator" callback', () => {
      const expectedColumnName = 'mySuperSpecialId';
      gridOptionsMock.datasetIdPropertyName = expectedColumnName;
      plugin.init(gridStub);
      const mockGetData = { addItem: vi.fn() };
      const getDataSpy = vi.spyOn(gridStub, 'getData').mockReturnValue(mockGetData as any);
      const addItemSpy = vi.spyOn(mockGetData, 'addItem');

      plugin.addonOptions!.newRowCreator!(2);

      expect(getDataSpy).toHaveBeenCalled();
      expect(addItemSpy).toHaveBeenCalledWith(expect.objectContaining({ [expectedColumnName]: 'newRow_0' }));
      expect(addItemSpy).toHaveBeenCalledWith(expect.objectContaining({ [expectedColumnName]: 'newRow_1' }));
    });

    it('should expect a formatted output after calling "dataItemColumnValueExtractor" callback', () => {
      plugin.init(gridStub);
      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: 'John', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, formatter: myBoldFormatter }
      );
      expect(output).toBe('<b>John</b>');
    });

    it('should expect a sanitized formatted and empty output after calling "dataItemColumnValueExtractor" callback', () => {
      gridOptionsMock.textExportOptions = { sanitizeDataExport: true };
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);

      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: null },
        { id: 'lastName', field: 'lastName', exportWithFormatter: true, formatter: myBoldFormatter }
      );

      expect(output).toBe('');
    });

    it('should expect a sanitized formatted output after calling "dataItemColumnValueExtractor" callback', () => {
      gridOptionsMock.textExportOptions = { sanitizeDataExport: true };
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);

      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, formatter: myBoldFormatter }
      );

      expect(output).toBe('John');
    });

    it('should expect a sanitized formatted output, from a Custom Formatter, after calling "dataItemColumnValueExtractor" callback', () => {
      gridOptionsMock.textExportOptions = { sanitizeDataExport: true };
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);

      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, formatter: myBoldFormatter }
      );

      expect(output).toBe('John');
    });

    it('should return null when calling "dataItemColumnValueExtractor" callback with editable and editor, which is active on the current cell', () => {
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);
      (gridStub.getCellEditor as Mock).mockReturnValue({});
      (gridStub.getActiveCell as Mock).mockReturnValue({ row: 6, cell: 6 });

      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, editor: { model: Editors.text }, formatter: myBoldFormatter },
        6,
        6
      );

      expect(output).toBeNull();
    });

    it('should forward provided row and cell to formatter when calling "dataItemColumnValueExtractor"', () => {
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);

      const rowCellFormatter: Formatter = (row, cell) => `${row}:${cell}`;
      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, formatter: rowCellFormatter },
        6,
        6
      );

      expect(output).toBe('6:6');
    });

    it('should format output even if not editable and an editor is configured but a formatter is defined', () => {
      gridOptionsMock.editable = false;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      plugin.init(gridStub);

      const rowCellFormatter: Formatter = (row, cell) => `${row}:${cell}`;
      const output = plugin.addonOptions!.dataItemColumnValueExtractor!(
        { firstName: '<b>John</b>', lastName: 'Doe' },
        { id: 'firstName', field: 'firstName', exportWithFormatter: true, editor: { model: Editors.text }, formatter: rowCellFormatter },
        6,
        6
      );

      expect(output).toBe('6:6');
    });
  });
});
