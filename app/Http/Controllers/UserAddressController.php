<?php

namespace App\Http\Controllers;

use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserAddressController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:50',
            'recipient_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address_line_1' => 'required|string',
            'address_line_2' => 'nullable|string',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:10',
            'is_default' => 'boolean',
        ]);

        $user = Auth::user();

        // If this is the first address, make it default
        $isDefault = $request->is_default || $user->addresses()->count() === 0;

        if ($isDefault) {
            $user->addresses()->update(['is_default' => false]);
        }

        $user->addresses()->create($request->merge(['is_default' => $isDefault])->all());

        return back()->with('success', 'Alamat berhasil ditambahkan!');
    }

    public function update(Request $request, UserAddress $address)
    {
        $this->authorizeOwner($address);

        $request->validate([
            'label' => 'required|string|max:50',
            'recipient_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address_line_1' => 'required|string',
            'address_line_2' => 'nullable|string',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:10',
        ]);

        $address->update($request->all());

        return back()->with('success', 'Alamat berhasil diperbarui!');
    }

    public function destroy(UserAddress $address)
    {
        $this->authorizeOwner($address);
        
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $newDefault = Auth::user()->addresses()->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        return back()->with('success', 'Alamat berhasil dihapus!');
    }

    public function setDefault(UserAddress $address)
    {
        $this->authorizeOwner($address);
        
        Auth::user()->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return back()->with('success', 'Alamat utama berhasil diubah!');
    }

    private function authorizeOwner(UserAddress $address)
    {
        if ($address->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
