/**
 * Tests virtual trait methods
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
 *
 * Note that tests for super calls are contained within LinearizationTest;
 * these test cases simply ensure that overrides are actually taking place.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );
    },


    /**
     * If a trait specifies a virtual method, then the class should expose
     * the method as virtual.
     */
    'Class inherits virtual trait method': function()
    {
        var called = false;

        var T = this.Sut(
        {
            'virtual foo': function()
            {
                called = true;
            }
        } );

        var C = this.Class.use( T ).extend( {} );

        // ensure that we are actually using the method
        C().foo();
        this.assertOk( called, "Virtual method not called" );

        // if virtual, we should be able to override it
        var called2 = false,
            C2;

        this.assertDoesNotThrow( function()
        {
            C2 = C.extend(
            {
                'override foo': function()
                {
                    called2 = true;
                }
            } );
        } );

        C2().foo();
        this.assertOk( called2, "Method not overridden" );
    },


    /**
     * Virtual trait methods should be treated in a manner similar to
     * abstract trait methods---a class should be able to provide its own
     * concrete implementation. Note that this differs from the above test
     * because we are overriding the method internally at definition time,
     * not subclassing.
     */
    'Class can override virtual trait method': function()
    {
        var _self = this;
        var T = this.Sut(
        {
            'virtual foo': function()
            {
                // we should never execute this (unless we're broken)
                _self.fail( true, false,
                    "Method was not overridden."
                );
            }
        } );

        var expected = 'foobar';
        var C = this.Class.use( T ).extend(
        {
            'override foo': function() { return expected; }
        } );

        this.assertEqual( C().foo(), expected );
    },


    /**
     * If C uses T and overrides T.Ma, and there is some method T.Mb that
     * invokes T.Ma, then T.Mb should instead invoke C.Ma.
     */
    'Class-overridden virtual trait method is accessible by trait':
    function()
    {
        var _self = this;

        var T = this.Sut(
        {
            'public doFoo': function()
            {
                // should call overridden, not the one below
                this.foo();
            },

            // to be overridden
            'virtual protected foo': function()
            {
                _self.fail( true, false, "Method not overridden." );
            },
        } );

        var called = false;

        var C = this.Class.use( T ).extend(
        {
            // should be called by T.doFoo
            'override protected foo': function() { called = true },
        } );

        C().doFoo();
        this.assertOk( called );
    },


    /**
     * If a supertype mixes in a trait that provides a virtual method, a
     * subtype should be able to provide its own concrete implementation.
     * This is especially important to test in the case where a trait
     * invokes its own virtual method---we must ensure that the message is
     * properly passed to the subtype's override.
     *
     * For a more formal description of a similar matter, see the
     * AbstractTest case; indeed, we're trying to mimic the same behavior
     * that we'd expect with abstract methods.
     */
    'Subtype can override virtual method of trait mixed into supertype':
    function()
    {
        var _self = this;

        var T = this.Sut(
        {
            'public doFoo': function()
            {
                // this call should be passed to any overrides
                return this.foo();
            },

            // this is the one we'll try to override
            'virtual protected foo': function()
            {
                _self.fail( true, false, "Method not overridden." );
            },
        } );

        var called = false;

        // C is a subtype of a class that implements T
        var C = this.Class.use( T ).extend( {} )
            .extend(
            {
                // this should be called instead of T.foo
                'override protected foo': function()
                {
                    called = true;
                },
            } );

        C().doFoo();
        this.assertOk( called );
    },


    /**
     * Virtual methods for traits are handled via a series of proxy methods
     * that determine, at runtime (as opposed to when the class is created),
     * where the call should go. (At least that was the implementation at
     * the time this test was written.) This test relies on the proper
     * parameter metadata being set on those proxy methods so that the
     * necessary length requirements can be validated.
     *
     * This was a bug in the initial implemenation: the above tests did not
     * catch it because the virtual methods had no arguments. The initial
     * problem was that, since __length was not defined on the generated
     * method that was recognized as the override, it was always zero, which
     * always failed if there were any arguments on the virtual method. The
     * reverse case was also a problem, but it didn't manifest as an
     * error---rather, it did *not* error when it should have.
     *
     * Note the instantiation in these cases: this is because the trait
     * implementation lazily performs the mixin on first use.
     */
    'Subtype must meet compatibility requirements of virtual trait method':
    function()
    {
        var _self = this;

        var C = this.Class.use(
            this.Sut( { 'virtual foo': function( a, b ) {} } )
        );

        this.assertThrows( function()
        {
            // does not meet param requirements (note the
            // instantiation---traits defer processing until they are used)
            C.extend( { 'override foo': function( a ) {} } )();
        } );

        this.assertDoesNotThrow( function()
        {
            // does not meet param requirements (note the
            // instantiation---traits defer processing until they are used)
            C.extend( { 'override foo': function( a, b ) {} } )();
        } );
    },


    /**
     * This is the same concept as the non-virtual test found in the
     * DefinitionTest case: since a trait is mixed into a class, if it
     * returns itself, then it should in actuality return the instance of
     * the class it is mixed into.
     */
    'Virtual trait method returning self returns class instance':
    function()
    {
        var _self = this;

        var T = this.Sut( { 'virtual foo': function() { return this; } } );

        this.Class.use( T ).extend(
        {
            go: function()
            {
                _self.assertStrictEqual( this, this.foo() );
            },
        } )().go();
    },


    /**
     * Same concept as the above test case, but ensures that invoking the
     * super method does not screw anything up.
     */
    'Overridden virtual trait method returning self returns class instance':
    function()
    {
        var _self = this;

        var T = this.Sut( { 'virtual foo': function() { return this; } } );

        this.Class.use( T ).extend(
        {
            'override foo': function()
            {
                return this.__super();
            },

            go: function()
            {
                _self.assertStrictEqual( this, this.foo() );
            },
        } )().go();
    },


    /**
     * When a trait method is overridden, ensure that the data are properly
     * proxied back to the caller. This differs from the above tests, which
     * just make sure that the method is actually overridden and invoked.
     */
    'Data are properly returned from trait override super call': function()
    {
        var _self    = this,
            expected = {};

        var T = this.Sut(
        {
            'virtual foo': function() { return expected; }
        } );

        this.Class.use( T ).extend(
        {
            'override foo': function()
            {
                _self.assertStrictEqual( expected, this.__super() );
            },
        } )().foo();
    },


    /**
     * When a trait method is overridden by the class that it is mixed into,
     * and the super method is called, then the trait method should execute
     * within the private member context of the trait itself (as if it were
     * never overridden). Some kinky stuff would have to be going on (at
     * least in the implementation at the time this was written) for this
     * test to fail, but let's be on the safe side.
     */
    'Super trait method overrided in class executed within private context':
    function()
    {
        var expected = {};

        var T = this.Sut(
        {
            'virtual foo': function()
            {
                // should succeed
                return this.priv();
            },

            'private priv': function()
            {
                return expected;
            },
        } );

        this.assertStrictEqual( expected,
            this.Class.use( T ).extend(
            {
                'override virtual foo': function()
                {
                    return this.__super();
                },
            } )().foo()
        );
    },
} );
