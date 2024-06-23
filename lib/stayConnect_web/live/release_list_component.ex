defmodule StayConnectWeb.ReleaseListComponent do
  use StayConnectWeb, :live_component
  alias StayConnectWeb.CoreComponents

  def render(assigns) do
    ~H"""
    <ul class="space-y-3">
      <%= for item <- @items do %>
        <li class="flex flex-row group hover:bg-brand/10 rounded-md px-4 py-2 justify-between transition-colors ease-linear gap-4">
          <CoreComponents.button class="aspect-square h-full">
            Upvote
          </CoreComponents.button>
          <div class="flex flex-col justify-between grow">
            <div class="flex flex-row gap-x-5 items-center">
              <p class="text-lg">
                <strong class="font-semibold text-xl">
                  <%= item.artist.name %> − <%= item.title %>
                </strong>
                <%= if length(item.featuring)>0 do %>
                  ft.
                  <%= for feat <- item.featuring do %>
                    <a href=""><%= feat.name %></a>
                  <% end %>
                <% end %>
              </p>
              <div>
                <span class="text-sm"><%= item.type %></span>
              </div>
            </div>
            <div class="flex flex-row gap-x-3">
              <span class="text-slate-300 text-sm">avis</span>
              <%= for cat <- item.categories do %>
                <a class="text-slate-300 text-sm"><%= cat.title %></a>
              <% end %>
            </div>
          </div>
          <img alt="cover" class="aspect-square h-full" />
        </li>
      <% end %>
    </ul>
    """
  end
end
