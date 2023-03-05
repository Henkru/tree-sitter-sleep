const PREC = {
  ASSIGNMENT: -2,
  STATEMENT: -1,
  DEFAULT: 0,
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  INCLUSIVE_OR: 3,
  EXCLUSIVE_OR: 4,
  BITWISE_AND: 5,
  EQUAL: 6,
  RELATIONAL: 7,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11,
  EXP: 12,
  UNARY: 13,
  CALL: 14,
  SUBSCRIPT: 16,
  KEY_VALUE: 17
};

module.exports = grammar({
  name: 'sleep',

  extras: $ => [
    /\s|\\\r?\n/,
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($._statement),

    // ==== Statements ==== //
    _statement: $ => prec(PREC.STATEMENT, choice(
      $._block_statement,
      $.expression_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.foreach_statement,
      $.break_statement,
      $.continue_statement,
      $.throw_statement,
      $.try_statement,
      $.assert_statement,
      $.function_definition,
      $.inline_definition,
      $.return_statement,
      $.yield_statement,
      $.import_statement,
      $.general_definition
    )),

    _block_statement: $ => seq('{', repeat($._statement), '}'),

    expression_statement: $ => seq(
      $._expression,
      $.semicolon
    ),

    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $._block_statement),
      optional(seq(
        'else',
        field('alternative', choice($._block_statement, $.if_statement))
      ))
    )),

    while_statement: $ => seq(
      'while',
      field('variable', optional($._variable_expression)),
      field('condition', $.parenthesized_expression),
      field('body', $._block_statement)
    ),

    for_statement: $ => seq(
      'for',
      '(',
      field('initializer', optional(choice($._expression, $.comma_expression))),
      $.semicolon,
      field('condition', $._expression),
      $.semicolon,
      field('update', optional(choice($._expression, $.comma_expression))),
      ')',
      field('body', $._block_statement)
    ),

    comma_expression: $ => seq(
      field('left', $._expression),
      ',',
      field('right', choice($._expression, $.comma_expression))
    ),

    foreach_statement: $ => seq(
      'foreach',
      field('value', choice(
        seq($._variable_expression, "=>", $._variable_expression),
        $._variable_expression
      )),
      field('source', $.parenthesized_expression),
      field('body', $._block_statement)
    ),

    break_statement: $ => seq('break', $.semicolon),

    continue_statement: $ => seq('continue', $.semicolon),

    throw_statement: $ => seq('throw', $._expression, $.semicolon),

    try_statement: $ => seq(
      'try',
      field('body', $._block_statement),
      'catch',
      field('exception', $._variable_expression),
      field('handler', $._block_statement),
    ),

    assert_statement: $ => seq(
      'assert',
      field('condition', $._expression),
      optional(
        seq(':', field('message', $._string))
      ),
      $.semicolon
    ),

    function_definition: $ => seq(
      'sub',
      field('name', $.identifier),
      field('body', $._block_statement)
    ),

    inline_definition: $ => seq(
      'inline',
      field('name', $.identifier),
      field('body', $._block_statement)
    ),

    return_statement: $ => seq('return', $._expression, $.semicolon),

    yield_statement: $ => seq('yield', $._expression, $.semicolon),

    import_statement: $ => seq(
      'import',
      field('class', /[^ \t\n;]+/),
      optional(
        seq(
          'from:',
          field('package', /[^ \t\n;]+/)
        )
      ),
      $.semicolon
    ),

    general_definition: $ => seq(
      field('type', $.identifier),
      field('name', choice($.identifier, $._string)),
      field('body', $._block_statement)
    ),


    // ==== Expressions ==== //

    _expression: $ => choice(
      $._scalar_expression,
      $._variable_expression,
      $.array_expression,
      $.key_value_expression,
      $.hash_expression,
      $.parenthesized_expression,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.subscript_expression,
      $.update_expression,
      $.assignment_expression,
      $._block_statement,
      $.closure_invoke_expression
    ),

    _scalar_expression: $ => choice(
      $.integer,
      $.long,
      $.double,
      $._string,
      $.null,
    ),

    _variable_expression: $ => choice(
      $.variable,
      $.array_variable,
      $.hash_variable
    ),

    array_expression: $ => seq(
      '@(',
      commaSep($._expression),
      ')'
    ),

    key_value_expression: $ => prec.left(PREC.KEY_VALUE, seq(
      field('key', choice($._variable_expression, $.identifier)),
      '=>',
      field('value', $._expression)
    )),

    hash_expression: $ => seq(
      '%(',
      commaSep($.key_value_expression),
      ')'
    ),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    binary_expression: $ => {
      const table = [
        // Number operations
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],
        ['%', PREC.MULTIPLY],
        ['**', PREC.EXP],
        ['<=>', PREC.EQUAL],
        // Logical Comparasion
        ['&&', PREC.LOGICAL_AND],
        ['||', PREC.LOGICAL_OR],
        // Number Comparasion
        ['==', PREC.EQUAL],
        ['!=', PREC.EQUAL],
        ['>', PREC.RELATIONAL],
        ['<', PREC.RELATIONAL],
        ['>=', PREC.RELATIONAL],
        ['<=', PREC.RELATIONAL],
        // Bit operations
        ['|', PREC.INCLUSIVE_OR],
        ['^', PREC.EXCLUSIVE_OR],
        ['&', PREC.BITWISE_AND],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
        // String operations
        ['.', PREC.ADD],
        ['x', PREC.MULTIPLY],
        ['cmp', PREC.EQUAL],
        // String Comparasion
        ['eq', PREC.EQUAL],
        ['ne', PREC.EQUAL],
        ['lt', PREC.RELATIONAL],
        ['gt', PREC.RELATIONAL],
        ['isin', PREC.RELATIONAL],
        ['iswm', PREC.RELATIONAL],
        ['ismatch', PREC.RELATIONAL],
        ['hasmatch', PREC.RELATIONAL],
        // Reference Comparasion
        ['=~', PREC.EQUAL],
        ['is', PREC.EQUAL],
        ['isa', PREC.EQUAL],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      }));
    },

    unary_expression: $ => prec.left(PREC.UNARY, seq(
      field('operator', $.unary_operator),
      field('argument', $._expression)
    )),

    unary_operator: $ => choice(
      '-',
      /-[a-zA-Z]\w*/,
      '!',
    ),

    call_expression: $ => prec(PREC.CALL, seq(
      field('function', $.identifier),
      field('arguments', $.argument_list)
    )),

    argument_list: $ => seq(
      '(',
      commaSep(choice(
        $._expression,
        seq('\\', $._variable_expression),
        $.function_variable
      )),
      ')'
    ),

    subscript_expression: $ => prec(PREC.SUBSCRIPT, seq(
      field('argument', $._expression),
      '[',
      field('index', $._expression),
      ']'
    )),

    update_expression: $ => {
      const argument = field('argument', $._expression);
      const operator = field('operator', choice('--', '++'));
      return prec.right(PREC.UNARY, seq(argument, operator));
    },

    _assignment_left_expression: $ => choice(
      $._variable_expression,
      $.subscript_expression,
      alias($.argument_list, $.tuple)
    ),

    assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
      field('left', $._assignment_left_expression),
      field('operator', choice(
        '=',
        '+=',
        '-=',
        '*=',
        '/=',
        '&=',
        '|=',
        '^=',
        '<<=',
        '>>=',
        '.='
      )),
      field('right', $._expression)
    )),

    closure_invoke_expression: $ => seq(
      '[',
      field('closure', choice(
        $._variable_expression,
        $.function_variable,
        $._block_statement,
        'new',
        $.identifier
      )),
      field('message', optional($.identifier)),
      optional(seq(':', field('arguments', choice($._expression, $.comma_expression)))),
      ']'
    ),

    // ==== Variables ==== //

    variable: _ => /\$\w+/,
    array_variable: _ => /@\w+/,
    hash_variable: _ => /%\w+/,
    function_variable: _ => /&\w+/,

    // ==== Scalars ==== //

    integer: _ => {
      const decimal = /\d+/
      const hex = /0[xX][0-9a-fA-F]+/
      return choice(decimal, hex)
    },

    long: _ => {
      const decimal = /\d+L/
      const hex = /0[xX][0-9a-fA-F]+L/
      return choice(decimal, hex)
    },

    double: _ => /\d+\.\d+/,

    string_double: $ => seq(
      '"',
      repeat(choice(
        token.immediate(prec(1, /[^\\"\n]+/)),
        $.escape_sequence
      )),
      '"',
    ),

    _string: $ => choice($.string_double, $.string_single),

    string_single: $ => seq(
      "'",
      repeat(token.immediate(prec(1, /[^'\n]+/))),
      "'",
    ),

    escape_sequence: $ => token(prec(1, seq(
      '\\',
      choice(
        /[^xu]/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
      )
    ))),

    null: _ => "$null",

    identifier: _ => /\w+/,
    semicolon: _ => ';',
    comment: _ => seq('#', /[^\n]*/),
  }
});

function commaSep(rule) {
  return optional(commaSep1(rule))
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}
