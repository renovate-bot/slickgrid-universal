describe('Example 19 - ExcelCopyBuffer with Cell Selection', () => {
  const titles = [
    '',
    'Approval Date',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'AA',
    'AB',
    'AC',
    'AD',
    'AE',
    'AF',
    'AG',
    'AH',
    'AI',
    'AJ',
    'AK',
  ];
  const GRID_ROW_HEIGHT = 30;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example19`);
    cy.get('h3').should('contain', 'Example 19 - ExcelCopyBuffer with Cell Selection');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid19')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => {
        if (index > 0 && index < titles.length) {
          expect($child.text()).to.eq(titles[index]);
        }
      });
  });

  it('should make grid readonly and not editable', () => {
    cy.get('[data-test="toggle-readonly-btn"]').click();
  });

  describe('with Pagination of size 20', () => {
    it('should click on cell B14 then Ctrl+Shift+End with selection B14-CV19', () => {
      cy.getCell(14, 3, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_B14').click();

      cy.get('@cell_B14').type('{ctrl}{shift}{end}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":14,"fromCell":3,"toRow":19,"toCell":101}');
    });

    it('should click on cell CP3 then Ctrl+Shift+Home with selection A0-CP3', () => {
      cy.getCell(3, 94, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CP3').click();

      cy.get('@cell_CP3').type('{ctrl}{shift}{home}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":0,"toRow":3,"toCell":94}');
    });

    it('should click on cell CE7 then Shift+Home with selection A0-CE7', () => {
      cy.getCell(3, 83, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CE7').click();

      cy.get('@cell_CE7').type('{shift}{home}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":3,"fromCell":0,"toRow":3,"toCell":83}');
    });

    it('should click on cell CE7 then Shift+Ctrl+ArrowLeft with selection A0-CE7', () => {
      cy.getCell(3, 83, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CE7').click();

      cy.get('@cell_CE7').type('{shift}{ctrl}{leftarrow}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":3,"fromCell":0,"toRow":3,"toCell":83}');
    });

    it('should click on cell CG3 then Shift+PageDown multiple times with current page selection starting at E3 with selection E3-19', () => {
      cy.getCell(3, 85, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CG3').click();

      cy.get('@cell_CG3').type('{shift}{pagedown}{pagedown}{pagedown}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":3,"fromCell":85,"toRow":19,"toCell":85}');
    });

    it('should change to 2nd page then click on cell CF35 then Shift+PageUp multiple times with current page selection with selection D25-41', () => {
      cy.get('.slick-pagination .icon-seek-next').click();

      cy.getCell(15, 84, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CF35').click();

      cy.get('@cell_CF35').type('{shift}{pageup}{pageup}{pageup}');

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":84,"toRow":15,"toCell":84}');
    });
  });

  describe('no Pagination - showing all', () => {
    it('should hide Pagination', () => {
      cy.get('[data-text="toggle-pagination-btn"]').click();
    });

    it('should click on cell CR5 then Ctrl+Home keys and expect to scroll back to cell A0 without any selection range', () => {
      cy.getCell(5, 95, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CR95').click();

      cy.get('@cell_CR95').type('{ctrl}{home}');

      cy.get('#selectionRange').should('have.text', '');
    });

    it('should click on cell B10 and ArrowUp 3 times and ArrowDown 1 time and expect cell selection B8-B10', () => {
      cy.getCell(10, 2, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_B10').click();

      cy.get('@cell_B10').type('{shift}{uparrow}{uparrow}{uparrow}{downarrow}');

      cy.get('.slick-cell.l2.r2.selected').should('have.length', 3);

      cy.get('#selectionRange').should('have.text', '{"fromRow":8,"fromCell":2,"toRow":10,"toCell":2}');
    });

    it('should click on cell D10 then PageDown 2 times with selection D10-D50 (or D10-D52)', () => {
      // 52 is because of a page row count found to be 21 for current browser resolution set in Cypress => 21*2+10 = 52
      cy.getCell(10, 4, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_D10').click();

      cy.get('@cell_D10').type('{shift}{pagedown}{pagedown}');

      cy.get('#selectionRange').should('contains', /{"fromRow":10,"fromCell":4,"toCell":4,"toRow":5[0-2]}/);
    });

    it('should click on cell D10 then PageDown 3 times then PageUp 1 time with selection D10-D50 (or D10-D52)', () => {
      cy.getCell(10, 4, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_D10').click();

      cy.get('@cell_D10').type('{shift}{pagedown}{pagedown}{pagedown}{pageup}');

      cy.get('#selectionRange').should('contains', /{"fromRow":10,"fromCell":4,"toCell":4,"toRow":5[0-2]}/);
    });

    it('should click on cell E46 then Shift+End key with full row horizontal selection E46-CV46', () => {
      cy.getCell(46, 6, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_E46').click();

      cy.get('@cell_E46').type('{shift}{end}');

      cy.get('#selectionRange').should('have.text', '{"fromRow":46,"fromCell":6,"toRow":46,"toCell":101}');
    });

    it('should click on cell E46 then Shift+Ctrl+ArrowRight key with full row horizontal selection E46-CV46', () => {
      cy.getCell(46, 6, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_E46').click();

      cy.get('@cell_E46').type('{shift}{ctrl}{rightarrow}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":46,"fromCell":6,"toRow":46,"toCell":101}');
    });

    it('should click on cell E46 then Shift+Ctrl+ArrowUp key with full column vertical top selection E0-E46', () => {
      cy.getCell(46, 6, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_E46').click();

      cy.get('@cell_E46').type('{shift}{ctrl}{uparrow}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":6,"toRow":46,"toCell":6}');
    });

    it('should click on cell E46 then Shift+Ctrl+ArrowDown key with full column vertical bottom selection E46-E99', () => {
      cy.getCell(46, 6, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_E46').click();

      cy.get('@cell_E46').type('{shift}{ctrl}{downarrow}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":46,"fromCell":6,"toRow":99,"toCell":6}');
    });

    it('should click on cell F85 then Ctrl+Shift+End keys with selection F85-CV99', () => {
      cy.getCell(85, 7, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_F85').click();

      cy.get('@cell_F85').type('{ctrl}{shift}{end}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":85,"fromCell":7,"toRow":99,"toCell":101}');
    });

    it('should click on cell CP95 then Ctrl+Shift+Home keys with selection C0-CP95', () => {
      cy.getCell(95, 99, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CP95').click();

      cy.get('@cell_CP95').type('{ctrl}{shift}{home}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":0,"toRow":95,"toCell":99}');
    });

    it('should click on cell CR5 again then Ctrl+Home keys and expect to scroll back to cell A0 without any selection range', () => {
      cy.getCell(5, 95, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CR95').click();

      cy.get('@cell_CR95').type('{ctrl}{home}', { release: false });

      cy.get('#selectionRange').should('have.text', '');
    });

    it('should click on cell E20 again then Ctrl+A keys and expect to scroll select everything in the grid', () => {
      cy.getCell(20, 6, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_E20').click();

      cy.get('@cell_E20').type('{ctrl}{a}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":0,"toRow":99,"toCell":101}');
    });
  });

  describe('with Pagination', () => {
    it('should hide Pagination', () => {
      cy.get('[data-text="toggle-pagination-btn"]').click();
    });

    it('should click on cell B14 then Shift+End with selection B14-24', () => {
      cy.getCell(14, 3, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_B14').click();

      cy.get('@cell_B14').type('{shift}{end}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":14,"fromCell":3,"toRow":14,"toCell":101}');
    });

    it('should click on cell CS14 then Shift+Home with selection A14-CS14', () => {
      cy.getCell(14, 97, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CS14').click();

      cy.get('@cell_CS14').type('{shift}{home}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":14,"fromCell":0,"toRow":14,"toCell":97}');
    });

    it('should click on cell CN3 then Shift+PageDown multiple times with current page selection starting at E3 w/selection E3-19', () => {
      cy.getCell(3, 95, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CN3').click();

      cy.get('@cell_CN3').type('{shift}{pagedown}{pagedown}{pagedown}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":3,"fromCell":95,"toRow":19,"toCell":95}');
    });

    it('should change to 2nd page then click on cell CN41 then Shift+PageUp multiple times with current page selection w/selection D25-41', () => {
      cy.get('.slick-pagination .seek-next').click();

      cy.getCell(15, 92, '', { parentSelector: '.grid19', rowHeight: GRID_ROW_HEIGHT }).as('cell_CN41').click();

      cy.get('@cell_CN41').type('{shift}{pageup}{pageup}{pageup}', { release: false });

      cy.get('#selectionRange').should('have.text', '{"fromRow":0,"fromCell":92,"toRow":15,"toCell":92}');
    });
  });
});
