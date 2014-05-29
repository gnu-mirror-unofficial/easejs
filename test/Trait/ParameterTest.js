/**
 * Tests parameterized traits
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );

        var _self = this;
        this.createParamTrait = function( f )
        {
            return _self.Sut( { __mixin: ( f || function() {} ) } );
        };
    },


    /**
     * Since traits are reusable components mixed into classes, they
     * themselves do not have a constructor. This puts the user at a
     * disadvantage, because she would have to create a new trait to simply
     * to provide some sort of configuration at the time the class is
     * instantiated. Adding a method to do the configuration is another
     * option, but that is inconvenient, especially when the state is
     * intended to be immutable.
     *
     * This does not suffer from the issue that Scala is having in trying to
     * implement a similar feature because traits cannot have non-private
     * properties; the linearization process disambiguates.
     *
     * When a trait contains a __mixin method, it is created as a
     * ParameterTraitType instead of a TraitType. Both must be recognized as
     * traits so that they can both be mixed in as expected; a method is
     * provided to assert whether or not a trait is a parameter trait
     * programatically, since attempting to configure a non-param trait will
     * throw an exception.
     */
    'Can create parameter traits': function()
    {
        var T = this.createParamTrait();

        this.assertOk( this.Sut.isParameterTrait( T ) );
        this.assertOk( this.Sut.isTrait( T ) );
    },


    /**
     * A parameter trait is in an uninitialized state---it cannot be mixed
     * in until arguments have been provided; same rationale as a class
     * constructor.
     */
    'Cannot mix in a parameter trait': function()
    {
        var _self = this;
        this.assertThrows( function()
        {
            _self.Class.use( _self.createParamTrait() )();
        } );
    },


    /**
     * Invoking a parameter trait will produce an argument trait which may
     * be mixed in. This has the effect of appearing as though the trait is
     * being instantiated (but it's not).
     */
    'Invoking parameter trait produces argument trait': function()
    {
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.assertOk(
                _self.Sut.isArgumentTrait( _self.createParamTrait()() )
            );
        } );
    },


    /**
     * Traits cannot be instantiated; ensure that this remains true, even
     * with the parameterized trait implementation.
     */
    'Invoking a standard trait throws an exception': function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            // no __mixin method; not a param trait
            Sut( {} )();
        } );
    },


    /**
     * Argument traits can be mixed in just as non-parameterized traits can;
     * it would be silly not to consider them to be traits through our
     * reflection API.
     */
    'Recognizes argument trait as a trait': function()
    {
        this.assertOk(
            this.Sut.isTrait( this.createParamTrait()() )
        );
    },


    /**
     * A param trait, upon configuration, returns an immutable argument
     * trait; any attempt to invoke it (e.g. to try to re-configure) is in
     * error.
     */
    'Cannot re-configure argument trait': function()
    {
        var _self = this;
        this.assertThrows( function()
        {
            // ParameterTrait => ArgumentTrait => Error
            _self.createParamTrait()()();
        } );
    },


    /**
     * Upon instantiating a class into which an argument trait was mixed,
     * all configuration arguments should be passed to the __mixin method.
     * Note that this means that __mixin *will not* be called at the point
     * that the param trait is configured.
     */
    '__mixin is invoked upon class instantiation': function()
    {
        var called = 0;
        var T = this.createParamTrait( function()
        {
            called++;
        } );

        // ensure we only invoke __mixin a single time
        this.Class( {} ).use( T() )();
        this.assertEqual( called, 1 );
    },


    /**
     * Standard sanity check---make sure that the arguments provided during
     * configuration are passed as-is, by reference, to __mixin. Note that
     * this has the terrible consequence that, should one of the arguments
     * be modified by __mixin (e.g. an object field), then it will be
     * modified for all other __mixin calls. But that is the case with any
     * function. ;)
     */
    '__mixin is passed arguments by reference': function()
    {
        var args,
            a = { a: 'a' },
            b = { b: 'b' };

        var T = this.createParamTrait( function()
        {
            args = arguments;
        } );

        this.Class( {} ).use( T( a, b ) )();

        this.assertStrictEqual( a, args[ 0 ] );
        this.assertStrictEqual( b, args[ 1 ] );
    },


    /**
     * The __mixin method should be invoked within the context of the trait
     * and should therefore have access to its private members. Indeed,
     * parameterized traits would have far more limited use if __mixin did
     * not have access to private members, because that would be the proper
     * place to hold configuration data.
     */
    '__mixin has access to trait private members': function()
    {
        var expected = {};

        var T = this.Sut(
        {
            'private _foo': null,
            __mixin: function( arg ) { this._foo = arg; },
            getFoo: function() { return this._foo; },
        } );

        this.assertStrictEqual( expected,
            this.Class( {} ).use( T( expected ) )().getFoo()
        );
    },
} );

