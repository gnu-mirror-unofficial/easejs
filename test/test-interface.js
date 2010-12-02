/**
 * Tests interfaces
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package test
 */

require( './common' );

var assert         = require( 'assert' ),
    Class          = require( 'class' ),
    Interface      = require( 'interface' );

var FooType = Interface.extend();


assert.ok(
    ( FooType instanceof Object ),
    "Interface extend method creates a new object"
);

assert.equal(
    Object.isFrozen( FooType ),
    true,
    "Generated interface object should be frozen"
);


assert.throws( function()
{
    Interface.extend(
    {
        // properties (non-methods) are not permitted
        prop: 'not permitted',
    });
}, Error, "Only methods are permitted within Interface definitions" );

assert.doesNotThrow( function()
{
    Interface.extend(
    {
        method: function() {},
    });
}, Error, "Method declarations are allowed within Interface definitions" );
